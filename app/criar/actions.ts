"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { safeParse } from "valibot"
import { nanoid } from "nanoid"
import { put, del } from "@vercel/blob" // Import Vercel Blob functions

import { deleteImageSchema, updateImageSchema } from "@/lib/validations/image"
import { absoluteUrl } from "@/lib/utils"
import { getUserSubscriptionPlan } from "@/lib/subscription"
import { db } from "@/db"
import { images, users } from "@/db/schema"
import { eq } from "drizzle-orm"
import Replicate from "replicate"
// Removed: import { createServerClient } from "@/lib/supabase/server" // No longer needed for storage

const MAX_FREE_COUNTS = 3

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
})

interface GenerateImageParams {
  prompt: string
  negativePrompt?: string
  style: string
  userId: string
  cloneId: string | null
  imageSize: string
  guidanceScale: number
  numInferenceSteps: number
  seed: number | undefined
  modelId: string
  inputImageUrl?: string // Added inputImageUrl for variations
}

// Mapping from our internal imageSize IDs to the new aspect_ratio enum values
const aspectRatioMap: Record<string, string> = {
  square_hd: "1:1",
  square: "1:1",
  portrait_4_3: "3:4",
  portrait_16_9: "9:16",
  landscape_4_3: "4:3",
  landscape_16_9: "16:9",
}

export async function generateImage({
  prompt,
  negativePrompt,
  style,
  userId,
  cloneId,
  imageSize,
  guidanceScale,
  numInferenceSteps,
  seed,
  modelId,
  inputImageUrl, // Destructure inputImageUrl
}: GenerateImageParams) {
  const session = await auth()
  // Removed: const supabase = createServerClient() // No longer needed for storage

  if (!session?.user) {
    return redirect("/sign-in")
  }

  const freeTrial = await checkFreeTrial(userId)
  const subscriptionPlan = await getUserSubscriptionPlan(userId)

  if (!freeTrial && !subscriptionPlan?.isPro) {
    return {
      error: "Free trial has expired. Please upgrade to a pro plan.",
    }
  }

  const aspectRatio = aspectRatioMap[imageSize] || "1:1"

  const finalPrompt = `${prompt} in the style of ${style}`

  try {
    const inputParams: Record<string, any> = {
      prompt: finalPrompt,
      aspect_ratio: aspectRatio,
      guidance_scale: guidanceScale,
      num_inference_steps: numInferenceSteps,
    }

    if (seed !== undefined) {
      inputParams.seed = seed
    }
    if (negativePrompt && negativePrompt.trim() !== "") {
      inputParams.negative_prompt = negativePrompt
    }
    if (inputImageUrl) {
      // Add input_image if generating a variation
      inputParams.input_image = inputImageUrl
    }

    const output = await replicate.run(modelId, {
      input: inputParams,
    })

    if (!output || typeof output === "string" || !Array.isArray(output) || output.length === 0) {
      return {
        error: "Failed to generate image or invalid output from Replicate.",
      }
    }

    const replicateImageUrl = output[0] as string
    const imageId = nanoid()

    // Fetch the image blob from Replicate's URL
    const imageResponse = await fetch(replicateImageUrl)
    if (!imageResponse.ok) {
      console.error("Failed to fetch image from Replicate:", imageResponse.statusText)
      return { error: "Failed to fetch generated image." }
    }
    const imageBlob = await imageResponse.blob()

    // Upload the image blob to Vercel Blob Storage
    const { url: blobUrl, pathname: blobPathname } = await put(`${userId}/${imageId}.jpeg`, imageBlob, {
      access: "public", // Make the blob publicly accessible
      contentType: "image/jpeg",
    })

    if (!blobUrl) {
      console.error("Failed to get URL for uploaded blob.")
      return { error: "Failed to save image to storage." }
    }

    // Prepare metadata, including inputImageUrl if it's a variation
    const metadata: Record<string, any> = { blobPathname: blobPathname }
    if (inputImageUrl) {
      metadata.inputImageUrl = inputImageUrl
    }

    // Save the image metadata with the Vercel Blob URL to the database
    await db.insert(images).values({
      id: imageId,
      userId: userId,
      url: blobUrl, // Use the Vercel Blob public URL
      metadata: metadata, // Store metadata including blobPathname and inputImageUrl
      prompt: prompt,
      negativePrompt: negativePrompt,
      style: style,
      width: 0, // Placeholder, consider deriving from aspect_ratio or Replicate output
      height: 0, // Placeholder, consider deriving from aspect_ratio or Replicate output
      guidanceScale: guidanceScale,
      numInferenceSteps: numInferenceSteps,
      seed: seed,
      modelId: modelId,
    })

    await incrementApiLimit(userId)
    return {
      success: true,
      imageUrl: blobUrl, // Return the Vercel Blob URL
      imageId: imageId, // Return the new image ID
      model: modelId, // Return the model used
    }
  } catch (error: any) {
    console.log("Error during image generation or saving:", error)
    return {
      error: "Failed to generate and save image. Please try again.",
    }
  }
}

export async function checkFreeTrial(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    return false
  }

  if (user.imageGenerationCount < MAX_FREE_COUNTS) {
    return true
  } else {
    return false
  }
}

export async function incrementApiLimit(userId: string) {
  await db
    .update(users)
    .set({
      imageGenerationCount: users.imageGenerationCount + 1,
    })
    .where(eq(users.id, userId))
}

export async function getImages(userId: string) {
  try {
    const userImages = await db.query.images.findMany({
      where: eq(images.userId, userId),
      orderBy: (images, { desc }) => [desc(images.createdAt)],
    })

    return userImages
  } catch (error) {
    console.error("Error fetching images:", error)
    return []
  }
}

export async function deleteImage(imageId: string) {
  const validatedFields = safeParse(deleteImageSchema, { id: imageId })

  if (!validatedFields.success) {
    return {
      error: "Invalid image id!",
    }
  }

  try {
    // First, get the image URL and blobPathname from the database
    const imageData = await db.query.images.findFirst({
      where: eq(images.id, validatedFields.output.id),
      columns: {
        url: true,
        metadata: true, // Fetch metadata to get blobPathname
      },
    })

    if (!imageData?.url) {
      console.error("Image not found or URL missing for deletion.")
      return { error: "Image not found for deletion." }
    }

    const blobPathname = (imageData.metadata as any)?.blobPathname

    if (blobPathname) {
      // Delete the image from Vercel Blob Storage using its pathname
      const { error: deleteBlobError } = await del(blobPathname)
      if (deleteBlobError) {
        console.error("Error deleting image from Vercel Blob Storage:", deleteBlobError)
        // Log the error but proceed to delete from DB, or handle as critical
      }
    } else {
      console.warn(`No blobPathname found for image ${imageId}. Skipping Vercel Blob deletion.`)
    }

    // Delete the image record from the database
    await db.delete(images).where(eq(images.id, validatedFields.output.id))
    revalidatePath(absoluteUrl("/gallery"))

    return { success: true }
  } catch (error) {
    console.error("Error deleting image:", error)
    return {
      error: "Failed to delete image",
    }
  }
}

export async function updateImage(imageId: string, values: { prompt: string; style: string }) {
  const validatedFields = safeParse(updateImageSchema, {
    id: imageId,
    prompt: values.prompt,
    style: values.style,
  })

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    }
  }

  const { id, prompt, style } = validatedFields.output

  try {
    await db.update(images).set({ prompt: prompt, style: style }).where(eq(images.id, id))
    revalidatePath(absoluteUrl("/gallery"))

    return { success: true }
  } catch (error) {
    console.error("Error updating image:", error)
    return {
      error: "Failed to update image",
    }
  }
}

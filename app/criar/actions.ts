"use server"

import { auth } from "@/auth" // Assuming you use NextAuth.js; adjust if using Supabase Auth directly
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { nanoid } from "nanoid"
import { put, del } from "@vercel/blob"
import { createServerClient } from "@/lib/supabase/server" // For DB operations
import { db } from "@/db" // Assuming Drizzle ORM setup
import { images, users, clones as clonesTable } from "@/db/schema" // Drizzle schema
import { eq } from "drizzle-orm"
import Replicate from "replicate"
import { generateImageWithFalLoRA } from "@/lib/fal-service" // Import the new Fal.ai service
import type { FalInferenceInput } from "@/lib/fal-service"

// Removed: import { createServerClient } from "@/lib/supabase/server" // No longer needed for storage

const MAX_FREE_COUNTS = 3 // Example, adjust as needed

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
})

interface GenerateImageParams {
  prompt: string
  negativePrompt?: string
  style: string // This might be a predefined style or "clone"
  userId: string
  cloneId: string | null // If a clone is used, this is the ID of the clone record in your DB
  imageSize: string // e.g., "square_hd", "landscape_16_9"
  guidanceScale: number
  numInferenceSteps: number
  seed: number | undefined
  modelId: string // Replicate model ID (e.g., stable-diffusion-xl) OR Fal.ai LoRA ID if cloneId is present
  inputImageUrl?: string
}

// Mapping from our internal imageSize IDs to the new aspect_ratio enum values
const aspectRatioMap: Record<string, { width: number; height: number; name: string }> = {
  square_hd: { width: 1024, height: 1024, name: "1024x1024" },
  square: { width: 512, height: 512, name: "512x512" },
  portrait_4_3: { width: 768, height: 1024, name: "768x1024" },
  portrait_16_9: { width: 576, height: 1024, name: "576x1024" }, // Corrected for portrait
  landscape_4_3: { width: 1024, height: 768, name: "1024x768" },
  landscape_16_9: { width: 1024, height: 576, name: "1024x576" },
}

export async function generateImage({
  prompt,
  negativePrompt,
  style, // If style === "clone", then cloneId should be present
  userId,
  cloneId,
  imageSize,
  guidanceScale,
  numInferenceSteps,
  seed,
  modelId, // For Replicate, or base model for Fal if needed
  inputImageUrl,
}: GenerateImageParams) {
  const session = await auth()
  const supabase = createServerClient()

  if (!session?.user?.id) {
    // Ensure user ID from session matches provided userId for security
    console.error("User not authenticated or mismatch.")
    return redirect("/login")
  }
  if (session.user.id !== userId) {
    console.error("User ID mismatch.")
    return { error: "User authentication error." }
  }

  // TODO: Implement free trial and subscription checks if necessary
  // const freeTrial = await checkFreeTrial(userId)
  // const subscriptionPlan = await getUserSubscriptionPlan(userId)
  // if (!freeTrial && !subscriptionPlan?.isPro) {
  //   return { error: "Free trial has expired or plan does not allow generation." }
  // }

  const imageId = nanoid()
  let finalImageUrl: string | undefined
  let falPredictionId: string | undefined
  let actualModelUsed = modelId // Default to Replicate model

  try {
    if (cloneId && style === "clone") {
      // --- Generate with Fal.ai using a trained clone (LoRA) ---
      const cloneData = await db.query.clonesTable.findFirst({
        where: eq(clonesTable.id, cloneId),
        columns: { model_id: true, trigger_word: true }, // model_id here is the Fal.ai LoRA ID
      })

      if (!cloneData?.model_id) {
        return { error: "Selected clone is not trained or model ID is missing." }
      }

      actualModelUsed = cloneData.model_id // This is the Fal.ai LoRA ID

      const falInput: FalInferenceInput = {
        prompt: cloneData.trigger_word ? `${cloneData.trigger_word}, ${prompt}` : prompt, // Prepend trigger word
        negative_prompt: negativePrompt,
        lora_model_id: cloneData.model_id, // Pass the trained LoRA model ID
        lora_scale: 0.8, // Default LoRA scale, can be made configurable
        image_size: aspectRatioMap[imageSize]?.name || "1024x1024", // Pass dimensions string or object
        seed: seed,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
      }

      const falResponse = await generateImageWithFalLoRA(falInput)

      if (!falResponse.images || falResponse.images.length === 0) {
        console.error("Fal.ai inference failed or returned no images:", falResponse)
        return { error: "Failed to generate image with Fal.ai clone." }
      }
      finalImageUrl = falResponse.images[0].url
      falPredictionId = falResponse._fal_prediction_id // Store Fal's prediction ID if available

      // Upload Fal.ai image to Vercel Blob
      const imageResponseFromFal = await fetch(finalImageUrl)
      if (!imageResponseFromFal.ok) {
        console.error("Failed to fetch image from Fal.ai URL:", imageResponseFromFal.statusText)
        return { error: "Failed to fetch generated image from Fal.ai." }
      }
      const imageBlobFromFal = await imageResponseFromFal.blob()
      const { url: blobUrl, pathname: blobPathname } = await put(`${userId}/${imageId}.jpeg`, imageBlobFromFal, {
        access: "public",
        contentType: "image/jpeg",
      })
      finalImageUrl = blobUrl // Use the Vercel Blob URL

      // Save to DB
      await db.insert(images).values({
        id: imageId,
        userId: userId,
        url: finalImageUrl,
        prompt: prompt, // Original user prompt
        negativePrompt: negativePrompt,
        style: style, // "clone"
        model: actualModelUsed, // Fal.ai LoRA ID
        width: falResponse.images[0].width || aspectRatioMap[imageSize]?.width || 0,
        height: falResponse.images[0].height || aspectRatioMap[imageSize]?.height || 0,
        seed: falResponse.seed || seed,
        metadata: {
          fal_lora_id: cloneData.model_id,
          fal_trigger_word: cloneData.trigger_word,
          fal_prediction_id: falPredictionId,
          blobPathname: blobPathname,
          generation_params: { guidanceScale, numInferenceSteps, imageSize },
        },
        createdAt: new Date().toISOString(),
      })
    } else {
      // --- Generate with Replicate ---
      actualModelUsed = modelId // Replicate model ID
      const replicateAspectRatio = aspectRatioMap[imageSize]?.name.replace("x", ":") || "1:1" // Replicate uses "W:H"

      const finalReplicatePrompt = `${prompt}${style !== "none" && style !== "clone" ? ` in the style of ${style}` : ""}`

      const inputParams: Record<string, any> = {
        prompt: finalReplicatePrompt,
        aspect_ratio: replicateAspectRatio,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
      }
      if (seed !== undefined) inputParams.seed = seed
      if (negativePrompt && negativePrompt.trim() !== "") inputParams.negative_prompt = negativePrompt
      if (inputImageUrl) inputParams.input_image = inputImageUrl

      const output = await replicate.run(modelId, { input: inputParams })

      if (!output || typeof output === "string" || !Array.isArray(output) || output.length === 0) {
        return { error: "Failed to generate image or invalid output from Replicate." }
      }
      const replicateImageUrl = output[0] as string

      const imageResponseFromReplicate = await fetch(replicateImageUrl)
      if (!imageResponseFromReplicate.ok) {
        console.error("Failed to fetch image from Replicate:", imageResponseFromReplicate.statusText)
        return { error: "Failed to fetch generated image from Replicate." }
      }
      const imageBlobFromReplicate = await imageResponseFromReplicate.blob()
      const { url: blobUrl, pathname: blobPathname } = await put(`${userId}/${imageId}.jpeg`, imageBlobFromReplicate, {
        access: "public",
        contentType: "image/jpeg",
      })
      finalImageUrl = blobUrl

      await db.insert(images).values({
        id: imageId,
        userId: userId,
        url: finalImageUrl,
        prompt: prompt,
        negativePrompt: negativePrompt,
        style: style,
        model: actualModelUsed, // Replicate model ID
        width: aspectRatioMap[imageSize]?.width || 0,
        height: aspectRatioMap[imageSize]?.height || 0,
        seed: seed, // Replicate might return the actual seed used if not provided
        metadata: {
          replicate_model_id: modelId,
          blobPathname: blobPathname,
          generation_params: { guidanceScale, numInferenceSteps, imageSize, replicateAspectRatio },
        },
        createdAt: new Date().toISOString(),
      })
    }

    // TODO: await incrementApiLimit(userId)
    revalidatePath("/minhas-imagens") // Or your gallery page
    revalidatePath(`/imagem/${imageId}`)

    return {
      success: true,
      imageUrl: finalImageUrl,
      imageId: imageId,
      model: actualModelUsed,
    }
  } catch (error: any) {
    console.error("Error during image generation or saving:", error)
    return {
      error: `Failed to generate and save image: ${error.message || "Please try again."}`,
    }
  }
}

// ... (keep checkFreeTrial, incrementApiLimit, getImages, deleteImage, updateImage functions)
// Ensure these functions are compatible with your Drizzle setup if they were using Supabase client directly before.
// For example, checkFreeTrial and incrementApiLimit would query/update the 'users' table via Drizzle.

export async function checkFreeTrial(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { imageGenerationCount: true }, // Assuming imageGenerationCount is a column in your users table
  })

  if (!user || user.imageGenerationCount === undefined || user.imageGenerationCount === null) {
    // If no count, assume they have tries left or handle as error
    return true
  }
  // @ts-ignore
  return user.imageGenerationCount < MAX_FREE_COUNTS
}

export async function incrementApiLimit(userId: string) {
  const currentUser = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { imageGenerationCount: true },
  })

  const currentCount = currentUser?.imageGenerationCount || 0

  await db
    .update(users)
    .set({
      // @ts-ignore
      imageGenerationCount: currentCount + 1,
    })
    .where(eq(users.id, userId))
}

export async function getImages(userId: string) {
  try {
    const userImages = await db.query.images.findMany({
      where: eq(images.userId, userId),
      orderBy: (imagesTable, { desc }) => [desc(imagesTable.createdAt)],
    })
    return userImages
  } catch (error) {
    console.error("Error fetching images:", error)
    return []
  }
}

export async function deleteImage(imageId: string) {
  // ... (implementation using Drizzle and Vercel Blob)
  // Ensure you fetch blobPathname from metadata to delete from Vercel Blob
  const imageData = await db.query.images.findFirst({
    where: eq(images.id, imageId),
    columns: { url: true, metadata: true },
  })

  if (!imageData) return { error: "Image not found." }

  const blobPathname = (imageData.metadata as any)?.blobPathname
  if (blobPathname) {
    await del(blobPathname)
  }
  await db.delete(images).where(eq(images.id, imageId))
  revalidatePath("/minhas-imagens") // Or your gallery page
  return { success: true }
}

export async function updateImage(imageId: string, values: { prompt: string; style: string }) {
  // ... (implementation using Drizzle)
  await db.update(images).set({ prompt: values.prompt, style: values.style }).where(eq(images.id, imageId))
  revalidatePath("/minhas-imagens") // Or your gallery page
  revalidatePath(`/imagem/${imageId}`)
  return { success: true }
}

const FAL_INFERENCE_BASE_MODEL = "fal-ai/fast-sdxl" // Or whatever base model you are using

function getFalHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Key ${process.env.FAL_API_KEY}`,
  }
}

// Placeholder for testFalConnection and simulateImageGeneration if they are still needed
export async function testFalConnection() {
  // Implement a simple call to a Fal.ai status or info endpoint if available
  // Or try a very cheap/fast inference to test auth.
  try {
    // Example: try to get status of a known public model or a dummy request
    // This is just a placeholder, Fal.ai might not have a generic ping.
    const response = await fetch(`https://fal.ai/${FAL_INFERENCE_BASE_MODEL.replace("fal-ai/", "")}`, {
      method: "POST", // Or GET to a status endpoint
      headers: { ...getFalHeaders(), "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: "test" }), // Minimal payload for a test run
    })
    if (response.ok || response.status === 400) {
      // 400 might mean auth ok, bad input
      return { success: true, message: "Fal.ai connection seems OK." }
    }
    return { error: `Fal.ai connection test failed: ${response.status} ${await response.text()}` }
  } catch (e: any) {
    return { error: `Fal.ai connection test error: ${e.message}` }
  }
}

export async function simulateImageGeneration(params: any) {
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate delay
  return {
    success: true,
    imageUrl: "/placeholder.svg?height=512&width=512",
    imageId: nanoid(),
    model: "simulated-model",
    seed: 12345,
    generationTime: 2.0,
  }
}

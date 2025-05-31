"use server"

import { auth } from "@/auth"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { nanoid } from "nanoid"
import { put, del } from "@vercel/blob"
import { db } from "@/db"
import { images, users, clones as clonesTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import Replicate from "replicate"
// Updated import:
import { generateImageWithFalFluxLoRA } from "@/lib/fal-service"
import type { FalFluxLoraInferenceInput, FalImageOutput } from "@/lib/fal-service" // Import new types

const MAX_FREE_COUNTS = 100 // Example, adjust as needed

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "",
})

interface GenerateImageParams {
  prompt: string
  negativePrompt?: string
  style: string
  userId: string
  cloneId: string | null
  imageSize: string // e.g., "square_hd", "landscape_16_9"
  guidanceScale: number
  numInferenceSteps: number
  seed: number | undefined
  modelId: string // Replicate model ID OR Fal.ai base model if applicable (though Fal function specifies its own)
  inputImageUrl?: string // For Replicate variations
}

const aspectRatioMap: Record<string, { width: number; height: number; name: string }> = {
  square_hd: { width: 1024, height: 1024, name: "1024x1024" },
  square: { width: 512, height: 512, name: "512x512" },
  portrait_4_3: { width: 768, height: 1024, name: "768x1024" },
  portrait_16_9: { width: 576, height: 1024, name: "576x1024" },
  landscape_4_3: { width: 1024, height: 768, name: "1024x768" },
  landscape_16_9: { width: 1024, height: 576, name: "1024x576" },
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
  inputImageUrl,
}: GenerateImageParams) {
  const session = await auth()
  // const supabase = createServerClient() // Not used directly for storage here

  if (!session?.user?.id || session.user.id !== userId) {
    console.error("User not authenticated or mismatch.")
    return redirect("/login")
  }

  // TODO: Implement proper credit/subscription checks
  // const userRecord = await db.query.users.findFirst({ where: eq(users.id, userId) });
  // if (!userRecord || (userRecord.credits || 0) < 1) {
  //   return { error: "Insufficient credits." };
  // }

  const imageId = nanoid()
  let finalImageUrlToStore: string | undefined
  let falApiResponseData: FalImageOutput | undefined
  let actualModelUsed = modelId
  let generationMetadata: Record<string, any> = {}

  try {
    if (cloneId && style === "clone") {
      const cloneData = await db.query.clonesTable.findFirst({
        where: eq(clonesTable.id, cloneId),
        columns: { model_id: true, trigger_word: true, name: true }, // model_id is the LoRA .zip URL
      })

      if (!cloneData?.model_id) {
        return { error: "Selected clone is not ready or LoRA URL is missing." }
      }
      if (!cloneData.model_id.startsWith("http")) {
        return { error: "Invalid LoRA URL for the selected clone." }
      }

      actualModelUsed = `Fal.ai FLUX.1 + Clone: ${cloneData.name}` // Descriptive name

      const falInput: FalFluxLoraInferenceInput = {
        prompt: cloneData.trigger_word ? `${cloneData.trigger_word}, ${prompt}` : prompt,
        negative_prompt: negativePrompt,
        lora_zip_url: cloneData.model_id, // This is the .zip URL
        lora_scale: 0.8, // Default, make configurable if needed
        image_size: aspectRatioMap[imageSize]?.name || "1024x1024",
        seed: seed,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: 1,
      }

      const falResponse = await generateImageWithFalFluxLoRA(falInput)

      if (!falResponse.images || falResponse.images.length === 0) {
        console.error("Fal.ai inference failed or returned no images:", falResponse)
        return { error: "Failed to generate image with Fal.ai clone." }
      }
      falApiResponseData = falResponse.images[0]
      const tempFalImageUrl = falApiResponseData.url // URL from Fal.ai (temporary)

      // Upload Fal.ai image to Vercel Blob
      const imageResponseFromFal = await fetch(tempFalImageUrl)
      if (!imageResponseFromFal.ok) {
        console.error("Failed to fetch image from Fal.ai URL:", imageResponseFromFal.statusText)
        return { error: "Failed to fetch generated image from Fal.ai." }
      }
      const imageBlobFromFal = await imageResponseFromFal.blob()
      const { url: blobUrl, pathname: blobPathname } = await put(
        `${userId}/${imageId}.jpeg`, // Or use falApiResponseData.file_name if available and preferred
        imageBlobFromFal,
        { access: "public", contentType: imageBlobFromFal.type || "image/jpeg" },
      )
      finalImageUrlToStore = blobUrl // Use the Vercel Blob URL

      generationMetadata = {
        fal_lora_zip_url: cloneData.model_id,
        fal_trigger_word: cloneData.trigger_word,
        fal_request_data: falInput, // Log input for debugging
        fal_response_seed: falResponse.seed,
        blobPathname: blobPathname,
        generation_params: { guidanceScale, numInferenceSteps, imageSize },
      }
    } else {
      // --- Generate with Replicate ---
      actualModelUsed = modelId
      const replicateAspectRatio = aspectRatioMap[imageSize]?.name.replace("x", ":") || "1:1"
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
        contentType: imageBlobFromReplicate.type || "image/jpeg",
      })
      finalImageUrlToStore = blobUrl

      generationMetadata = {
        replicate_model_id: modelId,
        blobPathname: blobPathname,
        generation_params: { guidanceScale, numInferenceSteps, imageSize, replicateAspectRatio },
      }
    }

    if (!finalImageUrlToStore) {
      return { error: "Image URL was not finalized after generation." }
    }

    await db.insert(images).values({
      id: imageId,
      userId: userId,
      url: finalImageUrlToStore,
      prompt: prompt,
      negativePrompt: negativePrompt,
      style: style,
      model: actualModelUsed,
      width: falApiResponseData?.width || aspectRatioMap[imageSize]?.width || 0,
      height: falApiResponseData?.height || aspectRatioMap[imageSize]?.height || 0,
      seed: (cloneId && style === "clone" ? (generationMetadata as any).fal_response_seed : seed) ?? undefined,
      metadata: generationMetadata,
      createdAt: new Date().toISOString(),
    })

    // TODO: await decrementUserCredits(userId, 1);
    revalidatePath("/minhas-imagens")
    revalidatePath(`/imagem/${imageId}`)

    return {
      success: true,
      imageUrl: finalImageUrlToStore,
      imageId: imageId,
      model: actualModelUsed,
      // Include seed if available from Fal response
      seed: (cloneId && style === "clone" ? (generationMetadata as any).fal_response_seed : seed) ?? undefined,
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

export async function checkFreeTrial(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { imageGenerationCount: true },
  })
  if (!user || user.imageGenerationCount === undefined || user.imageGenerationCount === null) {
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
  const imageData = await db.query.images.findFirst({
    where: eq(images.id, imageId),
    columns: { url: true, metadata: true },
  })
  if (!imageData) return { error: "Image not found." }
  const blobPathname = (imageData.metadata as any)?.blobPathname
  if (blobPathname) {
    try {
      await del(blobPathname)
    } catch (delError) {
      console.warn(`Failed to delete blob ${blobPathname}:`, delError)
      // Decide if this should be a critical error or just a warning
    }
  }
  await db.delete(images).where(eq(images.id, imageId))
  revalidatePath("/minhas-imagens")
  return { success: true }
}

export async function updateImage(imageId: string, values: { prompt: string; style: string }) {
  await db.update(images).set({ prompt: values.prompt, style: values.style }).where(eq(images.id, imageId))
  revalidatePath("/minhas-imagens")
  revalidatePath(`/imagem/${imageId}`)
  return { success: true }
}

// testFalConnection and simulateImageGeneration can be removed or updated if still needed for other purposes.
// For now, the main Fal.ai interaction is through generateImageWithFalFluxLoRA.
const FAL_QUEUE_SUBMIT_URL = process.env.FAL_QUEUE_SUBMIT_URL

function getFalHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Key ${process.env.FAL_API_KEY}`,
  }
}

export async function testFalConnection() {
  // This test is now less relevant as we're using the queue system.
  // A better test would be to submit a very small, quick job to the queue.
  try {
    // Example: A very simple prompt to flux-lora without a LoRA to test connectivity
    const testInput: FalFluxLoraInferenceInput = {
      prompt: "test",
      lora_zip_url: "placeholder", // This won't be used if model can run without LoRA
      num_images: 1,
      image_size: { width: 64, height: 64 }, // Smallest possible
      num_inference_steps: 1, // Minimal steps
    }
    // Temporarily use a dummy lora_zip_url for a basic connectivity test
    // The actual model "fal-ai/flux-lora" might require a valid lora_weights.path
    // or might run in a base mode if lora_weights is omitted.
    // For a true test, you might need a known public valid (even if dummy) LoRA zip.
    // For now, let's assume the endpoint can be pinged.
    const body = {
      model: "fal-ai/flux-lora",
      input: { prompt: "test", num_images: 1, width: 64, height: 64, num_inference_steps: 1 },
    }
    const resp = await fetch(FAL_QUEUE_SUBMIT_URL, {
      method: "POST",
      headers: getFalHeaders(),
      body: JSON.stringify(body),
    })

    if (resp.ok) {
      const { request_id } = await resp.json()
      if (request_id) return { success: true, message: "Fal.ai queue submission test OK." }
    }
    return { error: `Fal.ai connection test failed: ${resp.status} ${await resp.text()}` }
  } catch (e: any) {
    return { error: `Fal.ai connection test error: ${e.message}` }
  }
}

export async function simulateImageGeneration(params: any) {
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return {
    success: true,
    imageUrl: "/placeholder.svg?height=512&width=512",
    imageId: nanoid(),
    model: "simulated-model",
    seed: 12345,
    generationTime: 2.0,
  }
}

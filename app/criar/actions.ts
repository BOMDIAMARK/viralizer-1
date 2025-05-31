// This file was already updated in a previous response.
// No changes needed here based on the "perform test" request itself,
// but it's central to the test.
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
import { generateImageWithFalFluxLoRA } from "@/lib/fal-service"
import type { FalFluxLoraInferenceInput, FalImageOutput } from "@/lib/fal-service"
import { fal } from "@/lib/fal"

const MAX_FREE_COUNTS = 100

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
  inputImageUrl?: string
}

const aspectRatioMap: Record<string, { width: number; height: number; name: string }> = {
  square_hd: { width: 1024, height: 1024, name: "square_hd" }, // Fal uses presets like this
  square: { width: 512, height: 512, name: "square" },
  portrait_4_3: { width: 768, height: 1024, name: "portrait_4_3" },
  portrait_16_9: { width: 576, height: 1024, name: "portrait_16_9" },
  landscape_4_3: { width: 1024, height: 768, name: "landscape_4_3" },
  landscape_16_9: { width: 1024, height: 576, name: "landscape_16_9" },
}

export async function generateImage({
  prompt,
  negativePrompt,
  style,
  userId,
  cloneId,
  imageSize, // This should be one of the Fal.ai preset strings like "landscape_4_3"
  guidanceScale,
  numInferenceSteps,
  seed,
  modelId, // Replicate model ID
  inputImageUrl,
}: GenerateImageParams) {
  const session = await auth()

  if (!session?.user?.id || session.user.id !== userId) {
    console.error("User not authenticated or mismatch.")
    return redirect("/login")
  }

  const imageId = nanoid()
  let finalImageUrlToStore: string | undefined
  let falApiResponseData: FalImageOutput | undefined
  let actualModelUsed = modelId
  let generationMetadata: Record<string, any> = {}

  try {
    if (cloneId && style === "clone") {
      const cloneData = await db.query.clonesTable.findFirst({
        where: eq(clonesTable.id, cloneId),
        columns: { model_id: true, trigger_word: true, name: true },
      })

      if (!cloneData?.model_id || !cloneData.model_id.startsWith("http")) {
        return { error: "Selected clone is not ready or LoRA URL is invalid." }
      }

      actualModelUsed = `Fal.ai FLUX.1 + Clone: ${cloneData.name}`

      const falInput: FalFluxLoraInferenceInput = {
        prompt: cloneData.trigger_word ? `${cloneData.trigger_word}, ${prompt}` : prompt,
        negative_prompt: negativePrompt,
        lora_zip_url: cloneData.model_id,
        lora_scale: 0.8,
        image_size: aspectRatioMap[imageSize]?.name || "square_hd", // Use Fal.ai preset string
        seed: seed,
        num_inference_steps: numInferenceSteps,
        guidance_scale: guidanceScale,
        num_images: 1,
      }

      const falResponse = await generateImageWithFalFluxLoRA(falInput)

      if (!falResponse.images || falResponse.images.length === 0) {
        return { error: "Failed to generate image with Fal.ai clone." }
      }
      falApiResponseData = falResponse.images[0]
      const tempFalImageUrl = falApiResponseData.url

      const imageResponseFromFal = await fetch(tempFalImageUrl)
      if (!imageResponseFromFal.ok) {
        return { error: "Failed to fetch generated image from Fal.ai." }
      }
      const imageBlobFromFal = await imageResponseFromFal.blob()
      const { url: blobUrl, pathname: blobPathname } = await put(`${userId}/${imageId}.jpeg`, imageBlobFromFal, {
        access: "public",
        contentType: imageBlobFromFal.type || "image/jpeg",
      })
      finalImageUrlToStore = blobUrl

      generationMetadata = {
        fal_lora_zip_url: cloneData.model_id,
        fal_trigger_word: cloneData.trigger_word,
        fal_request_data: { ...falInput, lora_zip_url: "REDACTED_FOR_LOG" }, // Avoid logging full LoRA URL if too long
        fal_response_seed: falResponse.seed,
        blobPathname: blobPathname,
        generation_params: { guidanceScale, numInferenceSteps, imageSize: falInput.image_size },
      }
    } else {
      // Replicate logic
      actualModelUsed = modelId
      const replicateAspectRatio =
        aspectRatioMap[imageSize]?.name.replace("_", ":").replace("square:hd", "1:1").replace("square", "1:1") || "1:1" // Adjust for Replicate format
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
      width:
        falApiResponseData?.width ||
        aspectRatioMap[imageSize]?.width ||
        (generationMetadata.generation_params as any)?.width ||
        0,
      height:
        falApiResponseData?.height ||
        aspectRatioMap[imageSize]?.height ||
        (generationMetadata.generation_params as any)?.height ||
        0,
      seed: (cloneId && style === "clone" ? (generationMetadata as any).fal_response_seed : seed) ?? undefined,
      metadata: generationMetadata,
      createdAt: new Date().toISOString(),
    })

    revalidatePath("/minhas-imagens")
    revalidatePath(`/imagem/${imageId}`)

    return {
      success: true,
      imageUrl: finalImageUrlToStore,
      imageId: imageId,
      model: actualModelUsed,
      seed: (cloneId && style === "clone" ? (generationMetadata as any).fal_response_seed : seed) ?? undefined,
    }
  } catch (error: any) {
    console.error("Error during image generation or saving:", error)
    return {
      error: `Failed to generate and save image: ${error.message || "Please try again."}`,
    }
  }
}

// Other helper functions (checkFreeTrial, incrementApiLimit, etc.) remain the same
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

export async function testFalConnection() {
  try {
    const result = await fal.subscribe("fal-ai/helloworld", {
      input: {},
      logs: false,
    })
    // @ts-ignore
    if (result && result.message === "Hello world!") {
      return { success: true, message: "Fal.ai client connection test OK (helloworld)." }
    }
    return { error: `Fal.ai helloworld test failed: Unexpected response: ${JSON.stringify(result)}` }
  } catch (e: any) {
    return { error: `Fal.ai client connection test error: ${e.message}` }
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

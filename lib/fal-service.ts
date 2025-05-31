import { fal } from "@fal-ai/client" // Import the Fal.ai client

// const FAL_API_URL_TRAINER_PORTRAIT = "https://api.fal.ai/v1/train"
// const FAL_MODEL_ID_TRAINER_PORTRAIT = "fal-ai/flux-lora-portrait-trainer"
const FAL_API_URL_FLUX_LORA_FAST_TRAINING = "https://api.fal.ai/v1/flux-lora-fast-training"
// const FAL_QUEUE_SUBMIT_URL = "https://api.fal.ai/v1/queue/submit" // No longer needed for subscribe
// const FAL_QUEUE_STATUS_URL = "https://api.fal.ai/v1/queue/status" // No longer needed for subscribe
const FAL_FLUX_LORA_MODEL_ID = "fal-ai/flux-lora" // Model for FLUX.1 [dev] + LoRA

// Config for the original portrait trainer (might be deprecated if fast training is preferred)
interface FalPortraitTrainConfig {
  trigger_word: string
  steps?: number
  batch_size?: number
  lr?: number
  num_epochs?: number
  guidance_scale?: number
  seed?: number
}

// Response for the original portrait trainer
interface FalPortraitTrainResponse {
  id: string
  status: string
  metrics?: { progress?: number; loss?: number | null }
  output?: { model_id: string }
  error?: any
}

// Payload for the new flux-lora-fast-training
interface FluxLoraFastTrainingPayload {
  images: string[]
  trigger: string
  steps: number
}

// Response for the new flux-lora-fast-training
interface FluxLoraFastTrainingResponse {
  trained_model: string // URL to download the trained LoRA (.zip file)
  bytes_trained: number
  trigger: string
  error?: string | { message?: string; details?: any }
  request_id?: string
}

// Input for generating image with FLUX.1 [dev] + LoRA URL using fal.subscribe
export interface FalFluxLoraInferenceInput {
  prompt: string
  negative_prompt?: string
  lora_zip_url: string // Public URL to the LoRA .zip file
  lora_scale?: number // Strength of LoRA application (e.g., 0.75)
  num_images?: number
  image_size?: { width: number; height: number } | string // e.g., "1024x1024" or "landscape_4_3" from Fal.ai docs
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
}

// Structure of the image object in Fal.ai's response
export interface FalImageOutput {
  url: string
  content_type: string
  width: number
  height: number
  file_name?: string
  file_size?: number
}

// Expected structure of the data part of the result from fal.subscribe for flux-lora
export interface FalFluxLoraSubscribeResultData {
  images: FalImageOutput[]
  seed: number
  // Other metadata specific to FLUX.1 [dev]
  _fal_data?: any // For any other specific data Fal might return
  // The client might also add other properties like request_id to the top-level result
}

// Note: The @fal-ai/client likely uses FAL_KEY or FAL_SECRET_KEY from env variables.
// Ensure this is set. If it expects FAL_API_KEY, it might need configuration or FAL_API_KEY might just work.

// This function still uses fetch as fal.subscribe is for inference, not training.
const getFalHeadersForTraining = () => {
  if (!process.env.FAL_API_KEY) {
    // Assuming training still uses FAL_API_KEY
    throw new Error("FAL_API_KEY environment variable is not set for training.")
  }
  return {
    Authorization: `Bearer ${process.env.FAL_API_KEY}`,
    "Content-Type": "application/json",
  }
}

export async function startFluxLoraFastTraining(
  publicImageUrls: string[],
  trigger: string,
  steps: number,
): Promise<FluxLoraFastTrainingResponse> {
  const payload: FluxLoraFastTrainingPayload = {
    images: publicImageUrls,
    trigger,
    steps,
  }
  console.log("Starting Fal.ai Flux LoRA Fast Training with payload:", payload)
  try {
    const response = await fetch(FAL_API_URL_FLUX_LORA_FAST_TRAINING, {
      method: "POST",
      headers: getFalHeadersForTraining(), // Use specific headers for training
      body: JSON.stringify(payload),
    })
    const responseBodyText = await response.text()
    if (!response.ok) {
      console.error(
        `Fal.ai Flux LoRA Fast Training request failed: ${response.status} ${response.statusText}`,
        responseBodyText,
      )
      try {
        const errorJson = JSON.parse(responseBodyText)
        throw new Error(
          `Fal.ai API error (${response.status}): ${errorJson.message || errorJson.detail || responseBodyText}`,
        )
      } catch (e) {
        throw new Error(`Fal.ai API error (${response.status}): ${responseBodyText}`)
      }
    }
    const responseData: FluxLoraFastTrainingResponse = JSON.parse(responseBodyText)
    console.log("Fal.ai Flux LoRA Fast Training successful:", responseData)
    return responseData
  } catch (error) {
    console.error("Error in startFluxLoraFastTraining:", error)
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

// Refactored function using fal.subscribe
export async function generateImageWithFalFluxLoRA(
  input: FalFluxLoraInferenceInput,
): Promise<FalFluxLoraSubscribeResultData> {
  const {
    prompt,
    negative_prompt,
    lora_zip_url,
    lora_scale = 0.8, // Default LoRA scale
    num_images = 1,
    image_size, // e.g., { width: 1024, height: 1024 } or "landscape_4_3"
    seed,
    num_inference_steps,
    guidance_scale,
  } = input

  const falInputPayload: Record<string, any> = {
    prompt,
    num_images,
    lora_weights: {
      path: lora_zip_url,
      scale: lora_scale,
    },
  }

  if (negative_prompt) falInputPayload.negative_prompt = negative_prompt
  if (seed) falInputPayload.seed = seed
  if (num_inference_steps) falInputPayload.num_inference_steps = num_inference_steps
  if (guidance_scale) falInputPayload.guidance_scale = guidance_scale

  // Handle image_size: fal.ai/flux/dev (and likely flux-lora) accepts presets or width/height
  if (image_size) {
    if (typeof image_size === "string") {
      // Pass string presets like "landscape_4_3", "square_hd" directly
      falInputPayload.image_size = image_size
    } else if (typeof image_size === "object" && image_size.width && image_size.height) {
      // Pass width/height if provided as an object
      falInputPayload.width = image_size.width
      falInputPayload.height = image_size.height
    }
  } else {
    // Default if not specified
    falInputPayload.image_size = "square_hd" // Or { width: 1024, height: 1024 }
  }

  console.log(
    `Calling fal.subscribe ("${FAL_FLUX_LORA_MODEL_ID}") with input:`,
    JSON.stringify(falInputPayload, null, 2),
  )

  try {
    // The `fal.subscribe` method handles queueing, polling, and returns the final result.
    // It requires FAL_KEY or FAL_SECRET_KEY to be set in environment variables.
    const result: any = await fal.subscribe(FAL_FLUX_LORA_MODEL_ID, {
      input: falInputPayload,
      logs: true, // Enable log streaming
      onQueueUpdate: (update) => {
        // Optional: Log progress updates from the queue
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => console.log(`[Fal.ai Log - ${update.request_id}]: ${log.message}`))
        } else if (update.status !== "COMPLETED" && update.status !== "ERROR") {
          console.log(
            `[Fal.ai Queue Update - ${update.request_id}]: Status: ${update.status}, Progress: ${update.progress?.percentage || 0}%`,
          )
        }
      },
    })

    // `result` should directly contain the data upon successful completion.
    // The structure of `result` might be { data: FalFluxLoraSubscribeResultData, requestId: string, ... }
    // or `result` itself is FalFluxLoraSubscribeResultData if the client unwraps it.
    // Based on the example `console.log(result.data)`, we assume it's nested.

    // Let's check the structure of the result from fal.subscribe
    // The example `console.log(result.data)` suggests the actual output is in `result.data`.
    // And `result.requestId` for the request ID.

    if (!result || !result.images || result.images.length === 0) {
      console.error("Fal.ai subscription result is empty or missing images:", result)
      throw new Error("Fal.ai image generation returned no image data.")
    }

    console.log(`Fal.ai job ${result.request_id || "unknown_id"} succeeded.`)
    // The result from fal.subscribe for flux-lora should directly be the success data.
    // Let's assume `result` itself is `FalFluxLoraSubscribeResultData` if `result.data` is not the pattern.
    // The example `console.log(result.data)` implies the data is nested.
    // However, the type hint for `fal.subscribe` might return the data directly.
    // Let's assume the successful output is the `result` object itself, matching `FalFluxLoraSubscribeResultData`.
    // If it's nested under `result.data`, we'll adjust.
    // The provided example `console.log(result.data)` is for `fal-ai/flux/dev`.
    // Let's assume for now that the successful result is the direct output.
    // If testing shows it's `result.data.images`, we'll adjust.
    // For safety, let's check for `result.images` first, then `result.data.images`.

    let outputData: FalFluxLoraSubscribeResultData
    if (result.images && Array.isArray(result.images)) {
      outputData = result as FalFluxLoraSubscribeResultData
    } else if (result.data && result.data.images && Array.isArray(result.data.images)) {
      outputData = result.data as FalFluxLoraSubscribeResultData
    } else {
      console.error("Fal.ai subscription result structure is unexpected:", result)
      throw new Error("Fal.ai image generation returned data in an unexpected format.")
    }

    if (!outputData.images || outputData.images.length === 0) {
      console.error("Fal.ai subscription result is empty or missing images:", outputData)
      throw new Error("Fal.ai image generation returned no image data.")
    }

    console.log(`Fal.ai job for prompt "${input.prompt}" succeeded. Request ID: ${result.request_id || "N/A"}`)
    return outputData
  } catch (error: any) {
    console.error(`Error during fal.subscribe to "${FAL_FLUX_LORA_MODEL_ID}":`, error)
    // The client library might throw an error object with more details.
    throw new Error(`Fal.ai image generation failed: ${error.message || "Unknown error from Fal.ai client."}`)
  }
}

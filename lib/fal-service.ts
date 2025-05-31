import { fal } from "@fal-ai/client" // Import the Fal.ai client

// const FAL_API_URL_TRAINER_PORTRAIT = "https://api.fal.ai/v1/train"
// const FAL_MODEL_ID_TRAINER_PORTRAIT = "fal-ai/flux-lora-portrait-trainer"
// const FAL_API_URL_FLUX_LORA_FAST_TRAINING = "https://api.fal.ai/v1/flux-lora-fast-training" // No longer needed for subscribe
const FAL_FLUX_LORA_MODEL_ID_INFERENCE = "fal-ai/flux-lora" // Model for FLUX.1 [dev] + LoRA inference
const FAL_FLUX_LORA_MODEL_ID_TRAINING = "fal-ai/flux-lora-fast-training" // Model for fast training via subscribe

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

// Input for flux-lora-fast-training via fal.subscribe
export interface FluxLoraFastTrainingSubscribeInput {
  images_data_url: string[] // Array of base64 encoded image data URIs
  trigger: string
  steps: number
}

// Response for flux-lora-fast-training via fal.subscribe
// The `result` from fal.subscribe will be this structure directly (or nested under `result.data`)
export interface FluxLoraFastTrainingSubscribeResult {
  trained_model: string // URL to download the trained LoRA (.zip file)
  bytes_trained: number
  trigger: string
  // Fal might also return error details directly in the JSON or via HTTP status
  error?: string | { message?: string; details?: any }
  // The client adds requestId to the top-level result object
  request_id?: string
}

// Input for generating image with FLUX.1 [dev] + LoRA URL using fal.subscribe
export interface FalFluxLoraInferenceInput {
  prompt: string
  negative_prompt?: string
  lora_zip_url: string
  lora_scale?: number
  num_images?: number
  image_size?: { width: number; height: number } | string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
}

export interface FalImageOutput {
  url: string
  content_type: string
  width: number
  height: number
  file_name?: string
  file_size?: number
}

export interface FalFluxLoraSubscribeResultData {
  images: FalImageOutput[]
  seed: number
  _fal_data?: any
}

// Refactored function for flux-lora-fast-training using fal.subscribe
export async function startFluxLoraFastTraining(
  imagesDataUrl: string[], // Expecting base64 data URLs
  trigger: string,
  steps: number,
): Promise<FluxLoraFastTrainingSubscribeResult> {
  const inputPayload: FluxLoraFastTrainingSubscribeInput = {
    images_data_url: imagesDataUrl,
    trigger,
    steps,
  }

  console.log(
    `Calling fal.subscribe ("${FAL_FLUX_LORA_MODEL_ID_TRAINING}") with input:`,
    { trigger: inputPayload.trigger, steps: inputPayload.steps, image_count: inputPayload.images_data_url.length }, // Avoid logging full base64
  )

  try {
    // fal.subscribe handles queueing, polling, and returns the final result.
    // Requires FAL_KEY or FAL_SECRET_KEY in env.
    const result: any = await fal.subscribe(FAL_FLUX_LORA_MODEL_ID_TRAINING, {
      input: inputPayload,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => console.log(`[Fal.ai Training Log - ${update.request_id}]: ${log.message}`))
        } else if (update.status !== "COMPLETED" && update.status !== "ERROR") {
          console.log(
            `[Fal.ai Training Queue Update - ${update.request_id}]: Status: ${update.status}, Progress: ${update.progress?.percentage || 0}%`,
          )
        }
      },
    })

    // Assuming the successful result is the direct output from fal.subscribe
    // or nested under `result.data` as per the example `console.log(result.data)`
    let outputData: FluxLoraFastTrainingSubscribeResult
    if (result.trained_model) {
      // Check for a key specific to this training response
      outputData = result as FluxLoraFastTrainingSubscribeResult
    } else if (result.data && result.data.trained_model) {
      outputData = result.data as FluxLoraFastTrainingSubscribeResult
      if (result.request_id && !outputData.request_id) {
        outputData.request_id = result.request_id
      }
    } else {
      console.error("Fal.ai training subscription result structure is unexpected:", result)
      throw new Error("Fal.ai training returned data in an unexpected format.")
    }

    if (!outputData.trained_model) {
      console.error("Fal.ai training subscription result is missing 'trained_model':", outputData)
      throw new Error("Fal.ai training did not return the trained model URL.")
    }

    console.log(
      `Fal.ai training job for trigger "${trigger}" succeeded. Request ID: ${outputData.request_id || result.request_id || "N/A"}`,
    )
    return outputData
  } catch (error: any) {
    console.error(`Error during fal.subscribe to "${FAL_FLUX_LORA_MODEL_ID_TRAINING}":`, error)
    throw new Error(`Fal.ai training failed: ${error.message || "Unknown error from Fal.ai client."}`)
  }
}

// Refactored function for inference using fal.subscribe
export async function generateImageWithFalFluxLoRA(
  input: FalFluxLoraInferenceInput,
): Promise<FalFluxLoraSubscribeResultData> {
  const {
    prompt,
    negative_prompt,
    lora_zip_url,
    lora_scale = 0.8,
    num_images = 1,
    image_size,
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

  if (image_size) {
    if (typeof image_size === "string") {
      falInputPayload.image_size = image_size
    } else if (typeof image_size === "object" && image_size.width && image_size.height) {
      falInputPayload.width = image_size.width
      falInputPayload.height = image_size.height
    }
  } else {
    falInputPayload.image_size = "square_hd"
  }

  console.log(
    `Calling fal.subscribe ("${FAL_FLUX_LORA_MODEL_ID_INFERENCE}") with input:`,
    JSON.stringify(falInputPayload, null, 2),
  )

  try {
    const result: any = await fal.subscribe(FAL_FLUX_LORA_MODEL_ID_INFERENCE, {
      input: falInputPayload,
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS" && update.logs) {
          update.logs.forEach((log) => console.log(`[Fal.ai Inference Log - ${update.request_id}]: ${log.message}`))
        } else if (update.status !== "COMPLETED" && update.status !== "ERROR") {
          console.log(
            `[Fal.ai Inference Queue Update - ${update.request_id}]: Status: ${update.status}, Progress: ${update.progress?.percentage || 0}%`,
          )
        }
      },
    })

    let outputData: FalFluxLoraSubscribeResultData
    if (result.images && Array.isArray(result.images)) {
      outputData = result as FalFluxLoraSubscribeResultData
    } else if (result.data && result.data.images && Array.isArray(result.data.images)) {
      outputData = result.data as FalFluxLoraSubscribeResultData
    } else {
      console.error("Fal.ai inference subscription result structure is unexpected:", result)
      throw new Error("Fal.ai inference returned data in an unexpected format.")
    }

    if (!outputData.images || outputData.images.length === 0) {
      console.error("Fal.ai inference subscription result is empty or missing images:", outputData)
      throw new Error("Fal.ai inference returned no image data.")
    }

    console.log(
      `Fal.ai inference job for prompt "${input.prompt}" succeeded. Request ID: ${result.request_id || "N/A"}`,
    )
    return outputData
  } catch (error: any) {
    console.error(`Error during fal.subscribe to "${FAL_FLUX_LORA_MODEL_ID_INFERENCE}":`, error)
    throw new Error(`Fal.ai inference failed: ${error.message || "Unknown error from Fal.ai client."}`)
  }
}

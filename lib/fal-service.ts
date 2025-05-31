// const FAL_API_URL_TRAINER_PORTRAIT = "https://api.fal.ai/v1/train"
// const FAL_MODEL_ID_TRAINER_PORTRAIT = "fal-ai/flux-lora-portrait-trainer"
const FAL_API_URL_FLUX_LORA_FAST_TRAINING = "https://api.fal.ai/v1/flux-lora-fast-training"
const FAL_QUEUE_SUBMIT_URL = "https://api.fal.ai/v1/queue/submit"
const FAL_QUEUE_STATUS_URL = "https://api.fal.ai/v1/queue/status"
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
  trained_model: string
  bytes_trained: number
  trigger: string
  error?: string | { message?: string; details?: any }
  request_id?: string
}

// Input for generating image with FLUX.1 [dev] + LoRA URL
interface FalFluxLoraInferenceInput {
  prompt: string
  negative_prompt?: string
  lora_zip_url: string // Public URL to the LoRA .zip file
  lora_scale?: number // Strength of LoRA application (e.g., 0.75)
  num_images?: number
  image_size?: { width: number; height: number } | string // e.g., "1024x1024"
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
  // webhookUrl?: string | null; // If you want to use webhooks
}

// Structure of the image object in Fal.ai's response
interface FalImageOutput {
  url: string
  content_type: string // Usually "image/png" or "image/jpeg"
  width: number
  height: number
  file_name?: string // Fal sometimes includes this
  file_size?: number // Fal sometimes includes this
}

// Response from Fal.ai queue after successful generation
interface FalFluxLoraInferenceSuccessData {
  images: FalImageOutput[]
  seed: number
  // Other metadata specific to FLUX.1 [dev]
  _fal_data?: any // For any other specific data Fal might return
}

interface FalQueueStatusResponse {
  status: "IN_QUEUE" | "IN_PROGRESS" | "SUCCEEDED" | "FAILED"
  request_id: string
  data?: FalFluxLoraInferenceSuccessData // Present when status is SUCCEEDED
  error?: any // Present when status is FAILED
  // Fal might also include progress metrics
  metrics?: {
    progress_percentage?: number
    current_step?: number
    total_steps?: number
  }
}

const getFalHeaders = () => {
  if (!process.env.FAL_API_KEY) {
    throw new Error("FAL_API_KEY environment variable is not set.")
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
      headers: getFalHeaders(),
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

// Updated function for generating images with FLUX.1 [dev] + a custom LoRA zip URL
// using Fal.ai's queue system.
export async function generateImageWithFalFluxLoRA(
  input: FalFluxLoraInferenceInput,
): Promise<FalFluxLoraInferenceSuccessData> {
  const {
    prompt,
    negative_prompt,
    lora_zip_url,
    lora_scale = 1.0,
    num_images = 1,
    image_size, // e.g., { width: 1024, height: 1024 } or "1024x1024"
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
      const parts = image_size.split("x")
      if (parts.length === 2) {
        falInputPayload.width = Number.parseInt(parts[0], 10)
        falInputPayload.height = Number.parseInt(parts[1], 10)
      } else {
        console.warn(`Invalid image_size string format: ${image_size}. Using default.`)
      }
    } else if (typeof image_size === "object" && image_size.width && image_size.height) {
      falInputPayload.width = image_size.width
      falInputPayload.height = image_size.height
    }
  }
  // Default to 1024x1024 if not specified or invalid
  if (!falInputPayload.width || !falInputPayload.height) {
    falInputPayload.width = 1024
    falInputPayload.height = 1024
  }

  const body = {
    model: FAL_FLUX_LORA_MODEL_ID,
    input: falInputPayload,
    // webhookUrl: null, // Set if you want to use webhooks
  }

  console.log(`Submitting to Fal.ai queue (${FAL_FLUX_LORA_MODEL_ID}) with payload:`, JSON.stringify(body, null, 2))

  const submitResponse = await fetch(FAL_QUEUE_SUBMIT_URL, {
    method: "POST",
    headers: getFalHeaders(),
    body: JSON.stringify(body),
  })

  if (!submitResponse.ok) {
    const errorText = await submitResponse.text()
    console.error("Fal.ai queue submission failed:", submitResponse.status, errorText)
    throw new Error(`Fal.ai queue submission failed (${submitResponse.status}): ${errorText}`)
  }

  const { request_id } = await submitResponse.json()
  if (!request_id) {
    throw new Error("Fal.ai queue submission did not return a request_id.")
  }
  console.log(`Fal.ai job submitted. Request ID: ${request_id}. Polling for status...`)

  // Polling for the result
  let attempts = 0
  const maxAttempts = 60 // Poll for up to 2 minutes (60 * 2s)
  const pollInterval = 2000 // 2 seconds

  while (attempts < maxAttempts) {
    await new Promise((resolve) => setTimeout(resolve, pollInterval))
    attempts++

    console.log(`Polling Fal.ai queue status for ${request_id}, attempt ${attempts}`)
    const statusResponse = await fetch(FAL_QUEUE_STATUS_URL, {
      method: "POST", // As per Fal.ai docs, status check is also a POST
      headers: getFalHeaders(),
      body: JSON.stringify({ requestId: request_id }), // Fal.ai docs show `requestId`
    })

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text()
      console.warn(`Fal.ai queue status check failed (${statusResponse.status}): ${errorText}. Continuing to poll.`)
      continue // Optionally, implement retry logic or fail faster for certain errors
    }

    const statusJson: FalQueueStatusResponse = await statusResponse.json()
    console.log(`Fal.ai status for ${request_id}: ${statusJson.status}`, statusJson.metrics || "")

    if (statusJson.status === "SUCCEEDED") {
      console.log(`Fal.ai job ${request_id} succeeded.`, statusJson.data)
      if (!statusJson.data || !statusJson.data.images || statusJson.data.images.length === 0) {
        throw new Error(`Fal.ai job ${request_id} SUCCEEDED but returned no image data.`)
      }
      return statusJson.data
    } else if (statusJson.status === "FAILED") {
      console.error(`Fal.ai job ${request_id} FAILED.`, statusJson.error)
      throw new Error(
        `Fal.ai image generation failed for ${request_id}: ${JSON.stringify(statusJson.error || "Unknown error")}`,
      )
    }
    // If IN_QUEUE or IN_PROGRESS, continue polling
  }

  throw new Error(`Fal.ai job ${request_id} timed out after ${maxAttempts * (pollInterval / 1000)} seconds.`)
}

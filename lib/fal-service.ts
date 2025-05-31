// const FAL_API_URL_TRAINER_PORTRAIT = "https://api.fal.ai/v1/train"
// const FAL_MODEL_ID_TRAINER_PORTRAIT = "fal-ai/flux-lora-portrait-trainer"
const FAL_API_URL_FLUX_LORA_FAST_TRAINING = "https://api.fal.ai/v1/flux-lora-fast-training"

// Define a base model for inference that supports LoRAs.
// This is a placeholder; you'll need to find the correct model on Fal.ai
// that can run SDXL/Flux inference and apply a LoRA.
const FAL_INFERENCE_BASE_MODEL = "fal-ai/sdxl-lightning" // Replace with actual Fal.ai model for inference + LoRA

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
  id: string // This is the train_id for polling
  status: string
  metrics?: { progress?: number; loss?: number | null }
  output?: { model_id: string } // The ID of the trained LoRA model for inference
  error?: any
}

// Payload for the new flux-lora-fast-training
interface FluxLoraFastTrainingPayload {
  images: string[] // Array of PUBLIC URLs to images
  trigger: string
  steps: number
}

// Response for the new flux-lora-fast-training
interface FluxLoraFastTrainingResponse {
  trained_model: string // URL to download the trained LoRA (.zip file)
  bytes_trained: number
  trigger: string
  // Fal might also return error details directly in the JSON or via HTTP status
  error?: string | { message?: string; details?: any }
  // It might also return some form of request ID for logging/tracking, even if synchronous
  request_id?: string
}

interface FalInferenceInput {
  prompt: string
  negative_prompt?: string
  // For this, it would be the URL of the trained_model .zip file,
  // or an ID if Fal processes/hosts it after you provide the URL.
  // This part needs clarification based on how Fal.ai inference models consume LoRAs by URL.
  lora_url: string // URL to the .zip file of the LoRA
  lora_scale?: number
  image_size?: { width: number; height: number } | string
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
}

interface FalInferenceResponse {
  images: Array<{
    url: string
    content_type: string
    width: number
    height: number
  }>
  seed?: number
  _fal_prediction_id?: string
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

// New function for flux-lora-fast-training
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

    const responseBodyText = await response.text() // Read text first for better error logging

    if (!response.ok) {
      console.error(
        `Fal.ai Flux LoRA Fast Training request failed: ${response.status} ${response.statusText}`,
        responseBodyText,
      )
      // Try to parse as JSON for structured error, fallback to text
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
    // Ensure the error is an Error instance
    if (error instanceof Error) {
      throw error
    } else {
      throw new Error(String(error))
    }
  }
}

// --- Functions for the original portrait trainer (might be deprecated or used for a different flow) ---
// export async function startFalPortraitCloneTraining(imagesBase64: string[], config: FalPortraitTrainConfig): Promise<FalPortraitTrainResponse> {
//   // ... implementation for the /v1/train endpoint ...
// }
// export async function getFalPortraitTrainStatus(trainId: string): Promise<FalPortraitTrainResponse> {
//   // ... implementation for polling /v1/train/{id} ...
// }
// --- End of original portrait trainer functions ---

// Function for generating images with a trained Fal.ai LoRA (URL based)
// This function will need significant adjustment based on how Fal.ai inference models
// consume LoRAs provided as URLs.
export async function generateImageWithFalLoRAFromUrl(input: FalInferenceInput): Promise<FalInferenceResponse> {
  const falInferenceEndpoint = `https://fal.ai/${FAL_INFERENCE_BASE_MODEL.replace("fal-ai/", "")}`

  // The payload structure for consuming a LoRA via URL is highly dependent on the FAL_INFERENCE_BASE_MODEL.
  // It might involve passing the lora_url directly, or the model might expect it to be
  // registered with Fal.ai first. This is a HYPOTHETICAL payload.
  const payload = {
    prompt: input.prompt,
    negative_prompt: input.negative_prompt,
    seed: input.seed,
    num_inference_steps: input.num_inference_steps || 25,
    guidance_scale: input.guidance_scale || 7.5,
    // How to specify the LoRA from a URL needs to be confirmed from Fal.ai docs.
    // It could be something like:
    loras: [
      {
        path: input.lora_url, // URL to the .zip file
        // Fal might require the LoRA to be unzipped and hosted, or it might handle .zip directly.
        // Or it might need to be registered with Fal first.
        scale: input.lora_scale || 0.8,
      },
    ],
    ...(typeof input.image_size === "string"
      ? { image_format: input.image_size }
      : { width: input.image_size?.width || 1024, height: input.image_size?.height || 1024 }),
  }

  console.log(
    `Generating image with Fal.ai LoRA URL (${input.lora_url}) using base model ${FAL_INFERENCE_BASE_MODEL}. Payload:`,
    payload,
  )

  try {
    const response = await fetch(falInferenceEndpoint, {
      method: "POST",
      headers: getFalHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Fal.ai inference (URL LoRA) request failed:", response.status, errorData)
      throw new Error(`Fal.ai API error (${response.status}) for inference: ${errorData || response.statusText}`)
    }

    const responseData: FalInferenceResponse = await response.json()
    if (response.headers.get("x-fal-prediction-id") && !responseData._fal_prediction_id) {
      responseData._fal_prediction_id = response.headers.get("x-fal-prediction-id")!
    }
    console.log("Fal.ai inference (URL LoRA) successful:", responseData)
    return responseData
  } catch (error) {
    console.error("Error in generateImageWithFalLoRAFromUrl:", error)
    if (error instanceof Error) throw error
    throw new Error(String(error))
  }
}

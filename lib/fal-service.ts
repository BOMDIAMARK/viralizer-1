const FAL_API_URL = "https://api.fal.ai/v1/train"
const FAL_MODEL_ID_TRAINER = "fal-ai/flux-lora-portrait-trainer"

// Define a base model for inference that supports LoRAs.
// This is a placeholder; you'll need to find the correct model on Fal.ai
// that can run SDXL/Flux inference and apply a LoRA.
// Examples could be 'fal-ai/sdxl-lightning' or a specific 'fal-ai/flux' model.
const FAL_INFERENCE_BASE_MODEL = "fal-ai/sdxl-lightning" // Replace with actual Fal.ai model for inference + LoRA

interface FalTrainConfig {
  trigger_word: string
  steps?: number
  batch_size?: number
  lr?: number
  num_epochs?: number
  guidance_scale?: number
  seed?: number
}

interface FalTrainPayload {
  model: string
  images: string[] // Array of base64 encoded image data URIs
  images: string[]
  config: FalTrainConfig
}

interface FalTrainResponse {
  id: string // This is the train_id, e.g., "train_abcdefgh1234"
  id: string
  status: string // e.g., "processing", "succeeded", "failed"
  status: string
  metrics?: {
    progress?: number // 0-100
    progress?: number
    loss?: number | null
    loss?: number | null
  }
  output?: {
    model_id: string // The ID of the trained clone model
    model_id: string // This is the LoRA model ID
  }
  error?: any
  error?: any
}

interface FalInferenceInput {
  prompt: string
  negative_prompt?: string
  // The LoRA model ID obtained from training
  // Fal.ai might have a specific way to pass this, e.g., as part of 'adapters' or 'loras' array
  lora_model_id: string
  lora_scale?: number // Weight of the LoRA
  image_size?: { width: number; height: number } | string // e.g., "square_hd", or { width: 1024, height: 1024 }
  seed?: number
  num_inference_steps?: number
  guidance_scale?: number
  // Add other parameters supported by the Fal.ai inference model
}

interface FalInferenceResponse {
  images: Array<{
    url: string
    content_type: string
    width: number
    height: number
  }>
  seed?: number
  // Other metadata from Fal.ai
  _fal_prediction_id?: string // To store Fal's internal prediction ID
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

export async function startFalCloneTraining(imagesBase64: string[], config: FalTrainConfig): Promise<FalTrainResponse> {
  const payload: FalTrainPayload = {
    model: FAL_MODEL_ID_TRAINER,
    images: imagesBase64,
    config: {
      steps: 100,
      batch_size: 4,
      lr: 1e-4,
      num_epochs: 3,
      guidance_scale: 7.5,
      seed: 2025,
      ...config, // User provided config overrides defaults
    },
  }

  console.log("Starting Fal.ai clone training with payload:", {
    model: payload.model,
    image_count: payload.images.length,
    config: payload.config,
  })

  try {
    const response = await fetch(FAL_API_URL, {
      method: "POST",
      headers: getFalHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Fal.ai training request failed:", response.status, errorData)
      throw new Error(`Fal.ai API error (${response.status}): ${errorData || response.statusText}`)
    }

    const responseData: FalTrainResponse = await response.json()
    console.log("Fal.ai training started successfully:", responseData)
    return responseData
  } catch (error) {
    console.error("Error in startFalCloneTraining:", error)
    throw error
  }
}

export async function getFalTrainStatus(trainId: string): Promise<FalTrainResponse> {
  console.log(`Fetching Fal.ai training status for ID: ${trainId}`)
  try {
    const response = await fetch(`${FAL_API_URL}/${trainId}`, {
      method: "GET",
      headers: getFalHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error(`Fal.ai status check failed for ${trainId}:`, response.status, errorData)
      throw new Error(`Fal.ai API error (${response.status}) checking status: ${errorData || response.statusText}`)
    }
    const responseData: FalTrainResponse = await response.json()
    return responseData
  } catch (error) {
    console.error(`Error in getFalTrainStatus for ${trainId}:`, error)
    throw error
  }
}

// New function for generating images with a trained Fal.ai LoRA
export async function generateImageWithFalLoRA(input: FalInferenceInput): Promise<FalInferenceResponse> {
  // Fal.ai's inference endpoints are typically structured like:
  // https://fal.ai/models/{model_author}/{model_name}/run or similar
  // Or a generic endpoint where you pass the model ID.
  // For this example, we'll construct it based on FAL_INFERENCE_BASE_MODEL
  // and assume it takes the LoRA as part of the input.

  // The actual Fal.ai endpoint for running a model with a LoRA might be different.
  // This is a common pattern: POST to fal.ai/{base_model_id}
  const falInferenceEndpoint = `https://fal.ai/${FAL_INFERENCE_BASE_MODEL.replace("fal-ai/", "")}` // Adjust if needed

  // Construct the payload for Fal.ai. This structure is HYPOTHETICAL and
  // depends heavily on how the chosen FAL_INFERENCE_BASE_MODEL accepts LoRAs.
  // You MUST check Fal.ai documentation for the correct payload structure.
  const payload = {
    // Common parameters
    prompt: input.prompt,
    negative_prompt: input.negative_prompt,
    seed: input.seed,
    num_inference_steps: input.num_inference_steps || 25, // Default steps
    guidance_scale: input.guidance_scale || 7.5, // Default guidance
    // LoRA specific parameters - this is a common way to pass LoRAs
    // It might be under an 'adapters' key or similar.
    loras: [
      {
        path: input.lora_model_id, // The ID of your trained LoRA
        scale: input.lora_scale || 0.8, // Default LoRA weight
      },
    ],
    // Image size might be passed as width/height or a preset string
    // This depends on the FAL_INFERENCE_BASE_MODEL
    ...(typeof input.image_size === "string"
      ? { image_format: input.image_size } // e.g. "1024x1024" or "square_hd"
      : { width: input.image_size?.width || 1024, height: input.image_size?.height || 1024 }),
    // Any other parameters the specific Fal.ai model accepts
  }

  console.log(
    `Generating image with Fal.ai LoRA (${input.lora_model_id}) using base model ${FAL_INFERENCE_BASE_MODEL}. Payload:`,
    payload,
  )

  try {
    // Fal.ai often uses a queue system for inference, similar to Replicate.
    // The initial POST might return a request ID, and you'd poll for results.
    // Or, for faster models, it might return the result directly or stream it.
    // For this example, let's assume it's a direct response or a short poll.
    // Fal.ai's /fal.ai/serverless-fal-ai/adapter pattern is common for this.
    // The URL might be more like: `https://110602490-sdxl-lightning.gateway.alpha.fal.ai` (example)
    // For a model that takes a LoRA, it might be a specific endpoint.
    // Let's assume a generic /run endpoint for the base model for now.
    // The actual endpoint might be `https://fal.ai/api/v1/predict/{FAL_INFERENCE_BASE_MODEL}` or similar.
    // The Fal Python client often abstracts this to `fal.subscribe(MODEL_ID, { input: {...} })`
    // which translates to an HTTP call.
    // A common pattern for models on Fal is `POST https://fal.ai/{model_id}`

    const response = await fetch(falInferenceEndpoint, {
      // This endpoint needs to be confirmed
      method: "POST",
      headers: getFalHeaders(),
      body: JSON.stringify(payload), // The payload structure is critical and model-dependent
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error("Fal.ai inference request failed:", response.status, errorData)
      throw new Error(`Fal.ai API error (${response.status}) for inference: ${errorData || response.statusText}`)
    }

    const responseData: FalInferenceResponse = await response.json()
    // Add Fal's prediction ID to the response if it's not already there
    if (response.headers.get("x-fal-prediction-id") && !responseData._fal_prediction_id) {
      responseData._fal_prediction_id = response.headers.get("x-fal-prediction-id")!
    }
    console.log("Fal.ai inference successful:", responseData)
    return responseData
  } catch (error) {
    console.error("Error in generateImageWithFalLoRA:", error)
    throw error // Re-throw to be caught by the server action
  }
}

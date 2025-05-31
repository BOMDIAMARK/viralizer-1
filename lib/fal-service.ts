const FAL_API_URL = "https://api.fal.ai/v1/train"
const FAL_MODEL_ID = "fal-ai/flux-lora-portrait-trainer" // As per documentation

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
  config: FalTrainConfig
}

interface FalTrainResponse {
  id: string // This is the train_id, e.g., "train_abcdefgh1234"
  status: string // e.g., "processing", "succeeded", "failed"
  metrics?: {
    progress?: number // 0-100
    loss?: number | null
  }
  output?: {
    model_id: string // The ID of the trained clone model
  }
  error?: any
}

const getFalHeaders = () => {
  if (!process.env.FAL_KEY) {
    throw new Error("FAL_KEY environment variable is not set.")
  }
  return {
    Authorization: `Bearer ${process.env.FAL_KEY}`,
    "Content-Type": "application/json",
  }
}

export async function startFalCloneTraining(imagesBase64: string[], config: FalTrainConfig): Promise<FalTrainResponse> {
  const payload: FalTrainPayload = {
    model: FAL_MODEL_ID,
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

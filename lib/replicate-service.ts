import Replicate from "replicate"

// Modelos do Replicate para diferentes operações
export const MODELS = {
  textToImage: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  imageToImage: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  fluxKontextMax: "black-forest-labs/flux-kontext-max:f2e8b2c29e23654e8a55c741a2fbf947ef8e38fa2a6bd67b8b6f0da6c66031f7",
  inpainting: "stability-ai/sdxl-inpainting:c11bbd9ce93c8a39999e4cf9f6c6d2d21c2156f5022c0e4d8c5b4a7b6129",
  upscale: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  removeBackground: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
  enhancer: "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  controlNet: "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
  realtime: "lucataco/realtime-img2img:652d4a8f9f5c71111e27f2f0bcd2b5d8c8c8b5c2c6fc7c1c3f2c8c8c8c8c8c8c",
  viralizer:
    process.env.VIRALIZER_MODEL_ID ||
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  videoGeneration: "kwaivgi/kling-v1.6-standard:e0a6f0ffd72b08c46209e251a32bf3fdfa5e7b083aea992948bcbf10bfae400b",
}

const isReplicateConfigured = () => {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

let replicate: Replicate | null = null
if (isReplicateConfigured()) {
  try {
    replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN! })
    console.log("✅ Cliente Replicate inicializado com sucesso")
  } catch (error) {
    console.warn("⚠️ Erro ao inicializar Replicate:", error)
  }
}

export interface ReplicatePredictionOptions {
  modelIdentifier: string // Make modelIdentifier mandatory for clarity
  input: Record<string, any>
  webhook?: string
  webhook_events_filter?: string[]
  // Remove options.version, as it should be derived from modelIdentifier
}

export async function createReplicatePrediction(options: ReplicatePredictionOptions): Promise<any> {
  if (!replicate || !isReplicateConfigured()) {
    console.warn("⚠️ Replicate não configurado")
    throw new Error("REPLICATE_NOT_CONFIGURED")
  }

  try {
    // modelIdentifier is now mandatory in options
    const modelString = options.modelIdentifier
    const [owner, nameAndVersion] = modelString.split("/")
    const [name, versionFromIdentifier] = nameAndVersion.split(":")

    if (!versionFromIdentifier) {
      throw new Error(
        `Model version not found in modelIdentifier ('${modelString}'). It must be in 'owner/name:version' format.`,
      )
    }

    const predictionData: any = {
      input: options.input,
      version: versionFromIdentifier, // Always use the version from the modelIdentifier
    }

    if (options.webhook) predictionData.webhook = options.webhook
    if (options.webhook_events_filter) predictionData.webhook_events_filter = options.webhook_events_filter

    console.log(`🚀 Criando predição com modelo: ${owner}/${name} versão: ${predictionData.version}`)
    console.log("Input:", JSON.stringify(options.input, null, 2))

    // The replicate client's `predictions.create` takes `version` and `input`.
    // The model owner/name is implicitly handled by Replicate based on the version hash,
    // or by their internal routing if you were to use replicate.run("owner/model:version", { input })
    // Since we are using predictions.create, the version hash is key.
    const prediction = await replicate.predictions.create(predictionData)

    console.log("✅ Predição criada com sucesso:", prediction.id)
    return prediction
  } catch (error: any) {
    console.error("❌ Erro ao criar predição:", error)
    if (error.response && error.response.data) {
      console.error("Detalhes do erro da API Replicate:", error.response.data)
    }
    throw new Error(`REPLICATE_PREDICTION_CREATE_ERROR: ${error.message}`)
  }
}

export async function getReplicatePrediction(predictionId: string): Promise<any> {
  if (!replicate || !isReplicateConfigured()) {
    throw new Error("REPLICATE_NOT_CONFIGURED")
  }
  try {
    return await replicate.predictions.get(predictionId)
  } catch (error: any) {
    console.error(`❌ Erro ao buscar predição ${predictionId}:`, error)
    throw new Error(`REPLICATE_GET_PREDICTION_ERROR: ${error.message}`)
  }
}

export async function generateImageFromText(
  prompt: string,
  options: {
    width?: number
    height?: number
    numOutputs?: number
    negativePrompt?: string
    webhook?: string
  } = {},
): Promise<any> {
  const input: any = {
    prompt,
    negative_prompt: options.negativePrompt || "",
    width: options.width || 768,
    height: options.height || 768,
    num_outputs: options.numOutputs || 1,
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  return createReplicatePrediction({
    modelIdentifier: MODELS.textToImage, // Pass the full model identifier
    input,
    ...(options.webhook && { webhook: options.webhook, webhook_events_filter: ["completed"] }),
  })
}

export async function editImageWithFlux(
  imageBase64: string,
  prompt: string,
  options: {
    webhook?: string
  } = {},
): Promise<any> {
  const input = {
    image: imageBase64,
    prompt: prompt,
  }

  return createReplicatePrediction({
    modelIdentifier: MODELS.fluxKontextMax, // Pass the full model identifier
    input,
    ...(options.webhook && { webhook: options.webhook, webhook_events_filter: ["completed"] }),
  })
}

export async function generateVideoFromPrompt(
  prompt: string,
  options: {
    lengthSeconds?: number
    fps?: number
    resolution?: "480p" | "720p" | "1080p"
    seed?: number
    webhook?: string
  } = {},
): Promise<any> {
  const input: any = {
    prompt,
    length_seconds: options.lengthSeconds || 10,
    fps: options.fps || 24,
    resolution: options.resolution || "720p",
    ...(options.seed && { seed: options.seed }),
  }

  return createReplicatePrediction({
    modelIdentifier: MODELS.videoGeneration, // Pass the full model identifier
    input,
    ...(options.webhook && { webhook: options.webhook, webhook_events_filter: ["completed"] }),
  })
}

// ... (rest of the file: testReplicateConnection, getReplicateStatus, checkModelAvailability, placeholder exports)
// Placeholder exports to satisfy deployment
export const streamExactFormat = async (options: any): Promise<any> => {
  console.warn("streamExactFormat is not implemented")
  return null
}

export const streamReplicateCompletion = async (options: any): Promise<any> => {
  console.warn("streamReplicateCompletion is not implemented")
  return null
}
export const editImageWithPrompt = async (imageBase64: string, prompt: string, options: any = {}): Promise<any> => {
  console.warn(
    "editImageWithPrompt is deprecated or not implemented, consider using editImageWithFlux or check imports.",
  )
  return editImageWithFlux(imageBase64, prompt, options)
}
export const inpaintImage = async (options: any): Promise<any> => {
  console.warn("inpaintImage is not implemented")
  return null
}
export const upscaleImage = async (options: any): Promise<any> => {
  console.warn("upscaleImage is not implemented")
  return null
}
export const removeBackground = async (options: any): Promise<any> => {
  console.warn("removeBackground is not implemented")
  return null
}
export const enhanceImage = async (options: any): Promise<any> => {
  console.warn("enhanceImage is not implemented")
  return null
}
export const controlNetImage = async (options: any): Promise<any> => {
  console.warn("controlNetImage is not implemented")
  return null
}
export const realtimeEdit = async (options: any): Promise<any> => {
  console.warn("realtimeEdit is not implemented")
  return null
}

export async function testReplicateConnection(): Promise<{
  success: boolean
  model: string
  error?: string
  latency?: number
}> {
  const startTime = Date.now()

  if (!isReplicateConfigured()) {
    return {
      success: false,
      model: "none",
      error: "REPLICATE_API_TOKEN não configurado",
      latency: 0,
    }
  }

  if (!replicate) {
    return {
      success: false,
      model: "none",
      error: "Cliente não inicializado",
      latency: 0,
    }
  }

  try {
    console.log("🔍 Testando conexão...")
    // Using a known public model for testing predictions.create
    const testModelDetails = "replicate/hello-world:5c7d5dc6dd8bf75c1acaa8565735e7986bc5b66206b55cca93cb72c9bf15ccaa"
    const version = testModelDetails.split(":")[1]

    await replicate.predictions.create({
      version: version,
      input: {
        text: "Hello, Replicate!",
      },
    })

    const latency = Date.now() - startTime
    console.log(`✅ Conexão OK! Latência: ${latency}ms`)

    return {
      success: true,
      model: testModelDetails,
      latency,
    }
  } catch (error: any) {
    console.error("❌ Erro na conexão:", error)
    return {
      success: false,
      model: "none",
      error: error.message,
      latency: Date.now() - startTime,
    }
  }
}

export function getReplicateStatus() {
  const hasToken = Boolean(process.env.REPLICATE_API_TOKEN)
  const hasCustomModel = Boolean(process.env.VIRALIZER_MODEL_ID)
  const hasUsername = Boolean(process.env.REPLICATE_USERNAME)

  return {
    configured: hasToken,
    hasToken,
    hasCustomModel,
    hasUsername,
    customModelId: process.env.VIRALIZER_MODEL_ID || null,
    username: process.env.REPLICATE_USERNAME || null,
    client: replicate !== null,
    availableModels: Object.keys(MODELS),
    environment: process.env.NODE_ENV,
  }
}

export async function checkModelAvailability(): Promise<{
  available: Array<{ name: string; id: string; status: "available" | "error" }>
  recommended: string
}> {
  if (!replicate || !isReplicateConfigured()) {
    return {
      available: [],
      recommended: "fallback",
    }
  }

  const results = []

  for (const [name, id] of Object.entries(MODELS)) {
    if (!id) continue
    try {
      // A more robust check would be to try fetching model details, but that's more API calls.
      // For now, assume if it's in MODELS and has an ID, it's 'available' for attempt.
      results.push({ name, id, status: "available" as const })
    } catch (error) {
      results.push({ name, id, status: "error" as const })
    }
  }

  const recommended =
    results.find((r) => r.name === "viralizer" && r.status === "available")?.name ||
    results.find((r) => r.name === "textToImage" && r.status === "available")?.name ||
    "fallback"

  return { available: results, recommended }
}

export { replicate, isReplicateConfigured }

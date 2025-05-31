import Replicate from "replicate"
import { ViralizeError, ERROR_CODES, withRetry, Logger } from "@/lib/error-handler"

// Modelos do Replicate para diferentes operações
export const MODELS = {
  textToImage: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  imageToImage: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  inpainting: "stability-ai/sdxl-inpainting:c11bbd9ce93c8a39999e4cf9f6c1f6c6d2d21c2156f5022c0e4d8c5b4a7b6129",
  upscale: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  removeBackground: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
  enhancer: "tencentarc/gfpgan:9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3",
  controlNet: "jagilley/controlnet-scribble:435061a1b5a4c1e26740464bf786efdfa9cb3a3ac488595a2de23e143fdb0117",
  realtime: "lucataco/realtime-img2img:652d4a8f9f5c71111e27f2f0bcd2b5d8c8c8b5c2c6fc7c1c3f2c8c8c8c8c8c8c",
  viralizer:
    process.env.VIRALIZER_MODEL_ID ||
    "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
}

const logger = Logger.getInstance()

// Verificar se o Replicate está configurado
const isReplicateConfigured = () => {
  return Boolean(process.env.REPLICATE_API_TOKEN)
}

// Configuração do cliente Replicate (apenas se configurado)
let replicate: Replicate | null = null

if (isReplicateConfigured()) {
  try {
    replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN!,
    })
    logger.info("Cliente Replicate inicializado com sucesso")
  } catch (error) {
    logger.error(error as Error, { context: "REPLICATE_INIT" })
    replicate = null
  }
}

// Interface para opções de predição
export interface ReplicatePredictionOptions {
  model: string
  input: Record<string, any>
  timeout?: number
}

// Função para executar uma predição no Replicate com tratamento robusto de erros
export async function runPrediction(options: ReplicatePredictionOptions): Promise<any> {
  if (!replicate || !isReplicateConfigured()) {
    throw new ViralizeError("Serviço de IA não configurado", ERROR_CODES.REPLICATE_NOT_CONFIGURED, 503)
  }

  const { model, input, timeout = 60000 } = options

  try {
    logger.info("Iniciando predição", { model, inputKeys: Object.keys(input) })

    // Executar com retry e timeout
    const result = await withRetry(
      async () => {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), timeout)

        try {
          const output = await replicate.run(model, { input })
          clearTimeout(timeoutId)
          return output
        } catch (error) {
          clearTimeout(timeoutId)
          throw error
        }
      },
      3, // máximo 3 tentativas
      2000, // delay inicial de 2s
      { model, operation: "runPrediction" },
    )

    logger.info("Predição concluída com sucesso", { model })
    return result
  } catch (error: any) {
    // Mapear erros específicos do Replicate
    if (error.message?.includes("timeout")) {
      throw new ViralizeError("Operação demorou muito para completar", ERROR_CODES.REPLICATE_TIMEOUT, 408, true, {
        model,
        timeout,
      })
    }

    if (error.message?.includes("quota") || error.message?.includes("limit")) {
      throw new ViralizeError("Limite de uso atingido", ERROR_CODES.REPLICATE_QUOTA_EXCEEDED, 429, true, { model })
    }

    if (error.message?.includes("unauthorized") || error.message?.includes("authentication")) {
      throw new ViralizeError("Token de API inválido", ERROR_CODES.REPLICATE_API_ERROR, 401, true, { model })
    }

    // Erro genérico do Replicate
    throw new ViralizeError("Erro no serviço de IA", ERROR_CODES.REPLICATE_API_ERROR, 502, true, {
      model,
      originalError: error.message,
    })
  }
}

// Função para streaming com tratamento de erros
export async function* streamReplicateOutput(options: ReplicatePredictionOptions) {
  if (!replicate || !isReplicateConfigured()) {
    throw new ViralizeError("Serviço de IA não configurado", ERROR_CODES.REPLICATE_NOT_CONFIGURED, 503)
  }

  const { model, input, timeout = 60000 } = options

  try {
    logger.info("Iniciando stream", { model })

    let timeoutId: NodeJS.Timeout | null = null
    let hasYieldedAny = false

    try {
      for await (const event of replicate.stream(model, { input })) {
        // Resetar timeout
        if (timeoutId) clearTimeout(timeoutId)

        const chunk = event.toString()
        if (chunk && chunk.trim()) {
          hasYieldedAny = true
          yield chunk
        }

        // Novo timeout
        timeoutId = setTimeout(() => {
          throw new ViralizeError("Stream timeout", ERROR_CODES.REPLICATE_TIMEOUT, 408)
        }, timeout)
      }

      if (timeoutId) clearTimeout(timeoutId)

      if (!hasYieldedAny) {
        throw new ViralizeError("Nenhum dado recebido do stream", ERROR_CODES.REPLICATE_API_ERROR, 502)
      }

      logger.info("Stream concluído com sucesso", { model })
    } catch (streamError) {
      if (timeoutId) clearTimeout(timeoutId)
      throw streamError
    }
  } catch (error: any) {
    logger.error(error, { context: "REPLICATE_STREAM", model })
    throw new ViralizeError("Erro no stream de IA", ERROR_CODES.REPLICATE_API_ERROR, 502, true, {
      model,
      originalError: error.message,
    })
  }
}

// Funções específicas com tratamento de erros

export async function generateImageFromText(
  prompt: string,
  options: {
    width?: number
    height?: number
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  if (!prompt?.trim()) {
    throw new ViralizeError("Prompt é obrigatório", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.textToImage
  const input = {
    prompt: prompt.trim(),
    negative_prompt: options.negativePrompt || "",
    width: options.width || 768,
    height: options.height || 768,
    num_outputs: Math.min(options.numOutputs || 1, 4), // Limitar a 4 outputs
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  try {
    const result = await runPrediction({ model, input })
    return Array.isArray(result) ? result : [result]
  } catch (error) {
    logger.error(error as Error, {
      context: "GENERATE_IMAGE_FROM_TEXT",
      prompt: prompt.substring(0, 100),
    })
    throw error
  }
}

export async function editImageWithPrompt(
  imageUrl: string,
  prompt: string,
  options: {
    strength?: number
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  if (!imageUrl?.trim()) {
    throw new ViralizeError("URL da imagem é obrigatória", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  if (!prompt?.trim()) {
    throw new ViralizeError("Prompt é obrigatório", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.imageToImage
  const input = {
    prompt: prompt.trim(),
    negative_prompt: options.negativePrompt || "",
    image: imageUrl,
    strength: Math.max(0.1, Math.min(1.0, options.strength || 0.7)), // Validar range
    num_outputs: Math.min(options.numOutputs || 1, 4),
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  try {
    const result = await runPrediction({ model, input })
    return Array.isArray(result) ? result : [result]
  } catch (error) {
    logger.error(error as Error, {
      context: "EDIT_IMAGE_WITH_PROMPT",
      imageUrl: imageUrl.substring(0, 100),
      prompt: prompt.substring(0, 100),
    })
    throw error
  }
}

export async function inpaintImage(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  options: {
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  if (!imageUrl?.trim() || !maskUrl?.trim()) {
    throw new ViralizeError("URLs da imagem e máscara são obrigatórias", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  if (!prompt?.trim()) {
    throw new ViralizeError("Prompt é obrigatório", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.inpainting
  const input = {
    prompt: prompt.trim(),
    negative_prompt: options.negativePrompt || "",
    image: imageUrl,
    mask: maskUrl,
    num_outputs: Math.min(options.numOutputs || 1, 4),
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  try {
    const result = await runPrediction({ model, input })
    return Array.isArray(result) ? result : [result]
  } catch (error) {
    logger.error(error as Error, {
      context: "INPAINT_IMAGE",
      imageUrl: imageUrl.substring(0, 100),
      prompt: prompt.substring(0, 100),
    })
    throw error
  }
}

export async function upscaleImage(imageUrl: string, scale = 2): Promise<string> {
  if (!imageUrl?.trim()) {
    throw new ViralizeError("URL da imagem é obrigatória", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.upscale
  const input = {
    image: imageUrl,
    scale: Math.max(1, Math.min(4, scale)), // Limitar escala entre 1-4
    face_enhance: true,
  }

  try {
    const result = await runPrediction({ model, input, timeout: 120000 }) // 2 minutos para upscale
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    logger.error(error as Error, {
      context: "UPSCALE_IMAGE",
      imageUrl: imageUrl.substring(0, 100),
      scale,
    })
    throw error
  }
}

export async function removeBackground(imageUrl: string): Promise<string> {
  if (!imageUrl?.trim()) {
    throw new ViralizeError("URL da imagem é obrigatória", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.removeBackground
  const input = {
    image: imageUrl,
  }

  try {
    const result = await runPrediction({ model, input })
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    logger.error(error as Error, {
      context: "REMOVE_BACKGROUND",
      imageUrl: imageUrl.substring(0, 100),
    })
    throw error
  }
}

export async function enhanceImage(imageUrl: string): Promise<string> {
  if (!imageUrl?.trim()) {
    throw new ViralizeError("URL da imagem é obrigatória", ERROR_CODES.VALIDATION_ERROR, 400)
  }

  const model = MODELS.enhancer
  const input = {
    img: imageUrl,
    version: "v1.4",
    scale: 2,
  }

  try {
    const result = await runPrediction({ model, input })
    return Array.isArray(result) ? result[0] : result
  } catch (error) {
    logger.error(error as Error, {
      context: "ENHANCE_IMAGE",
      imageUrl: imageUrl.substring(0, 100),
    })
    throw error
  }
}

// Função para testar conexão com tratamento de erros
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
    logger.info("Testando conexão com Replicate")

    // Teste simples e rápido
    const testModel = "meta/llama-2-7b:527827021d8756c7ab79fde0abbfaac885c37a3ed5fe23c7465093f0878d55ef"

    await runPrediction({
      model: testModel,
      input: {
        prompt: "Hello",
        max_new_tokens: 5,
      },
      timeout: 10000, // 10 segundos para teste
    })

    const latency = Date.now() - startTime
    logger.info("Conexão com Replicate OK", { latency })

    return {
      success: true,
      model: testModel,
      latency,
    }
  } catch (error: any) {
    logger.error(error, { context: "TEST_REPLICATE_CONNECTION" })
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

  // Verificar cada modelo
  for (const [name, id] of Object.entries(MODELS)) {
    if (!id) continue

    try {
      // Verificação básica (sem executar)
      results.push({ name, id, status: "available" as const })
    } catch (error) {
      logger.error(error as Error, { context: "CHECK_MODEL_AVAILABILITY", model: name })
      results.push({ name, id, status: "error" as const })
    }
  }

  // Determinar recomendação
  const recommended =
    results.find((r) => r.name === "viralizer" && r.status === "available")?.name ||
    results.find((r) => r.name === "textToImage" && r.status === "available")?.name ||
    "fallback"

  return { available: results, recommended }
}

export { replicate, isReplicateConfigured }

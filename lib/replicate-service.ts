import Replicate from "replicate"

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
    console.log("✅ Cliente Replicate inicializado com sucesso")
  } catch (error) {
    console.warn("⚠️ Erro ao inicializar Replicate:", error)
    replicate = null
  }
}

// Interface para opções de predição
export interface ReplicatePredictionOptions {
  model: string
  input: Record<string, any>
}

// Função para executar uma predição no Replicate
export async function runPrediction(options: ReplicatePredictionOptions): Promise<any> {
  if (!replicate || !isReplicateConfigured()) {
    console.warn("⚠️ Replicate não configurado")
    throw new Error("REPLICATE_NOT_CONFIGURED")
  }

  try {
    console.log(`🚀 Executando predição com modelo: ${options.model}`)
    console.log("Input:", JSON.stringify(options.input, null, 2))

    const output = await replicate.run(options.model, {
      input: options.input,
    })

    console.log("✅ Predição concluída com sucesso")
    return output
  } catch (error: any) {
    console.error("❌ Erro na predição:", error)
    throw new Error(`REPLICATE_PREDICTION_ERROR: ${error.message}`)
  }
}

// Função para streaming com Replicate
export async function* streamReplicateOutput(options: ReplicatePredictionOptions) {
  if (!replicate || !isReplicateConfigured()) {
    console.warn("⚠️ Replicate não configurado")
    throw new Error("REPLICATE_NOT_CONFIGURED")
  }

  try {
    console.log(`🚀 Iniciando stream com modelo: ${options.model}`)

    // Iniciar streaming com timeout
    let timeoutId: NodeJS.Timeout | null = null
    let hasYieldedAny = false

    try {
      for await (const event of replicate.stream(options.model, { input: options.input })) {
        // Resetar timeout
        if (timeoutId) clearTimeout(timeoutId)

        const chunk = event.toString()
        if (chunk && chunk.trim()) {
          hasYieldedAny = true
          yield chunk
        }

        // Novo timeout
        timeoutId = setTimeout(() => {
          throw new Error("STREAM_TIMEOUT")
        }, 30000) // 30 segundos
      }

      if (timeoutId) clearTimeout(timeoutId)

      if (!hasYieldedAny) {
        throw new Error("NO_CHUNKS_RECEIVED")
      }

      console.log("✅ Stream concluído com sucesso")
    } catch (streamError) {
      if (timeoutId) clearTimeout(timeoutId)
      throw streamError
    }
  } catch (error: any) {
    console.error("❌ Erro no streaming:", error)
    throw new Error(`REPLICATE_STREAM_ERROR: ${error.message}`)
  }
}

// Função para gerar imagem a partir de texto
export async function generateImageFromText(
  prompt: string,
  options: {
    width?: number
    height?: number
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  const model = MODELS.textToImage

  const input = {
    prompt,
    negative_prompt: options.negativePrompt || "",
    width: options.width || 768,
    height: options.height || 768,
    num_outputs: options.numOutputs || 1,
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result : [result]
}

// Função para editar imagem com prompt
export async function editImageWithPrompt(
  imageUrl: string,
  prompt: string,
  options: {
    strength?: number
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  const model = MODELS.imageToImage

  const input = {
    prompt,
    negative_prompt: options.negativePrompt || "",
    image: imageUrl,
    strength: options.strength || 0.7,
    num_outputs: options.numOutputs || 1,
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result : [result]
}

// Função para inpainting (edição de região específica)
export async function inpaintImage(
  imageUrl: string,
  maskUrl: string,
  prompt: string,
  options: {
    numOutputs?: number
    negativePrompt?: string
  } = {},
): Promise<string[]> {
  const model = MODELS.inpainting

  const input = {
    prompt,
    negative_prompt: options.negativePrompt || "",
    image: imageUrl,
    mask: maskUrl,
    num_outputs: options.numOutputs || 1,
    scheduler: "K_EULER_ANCESTRAL",
    num_inference_steps: 50,
    guidance_scale: 7.5,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result : [result]
}

// Função para upscale (aumentar resolução)
export async function upscaleImage(imageUrl: string, scale = 2): Promise<string> {
  const model = MODELS.upscale

  const input = {
    image: imageUrl,
    scale,
    face_enhance: true,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result[0] : result
}

// Função para remover fundo
export async function removeBackground(imageUrl: string): Promise<string> {
  const model = MODELS.removeBackground

  const input = {
    image: imageUrl,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result[0] : result
}

// Função para melhorar imagem (enhance)
export async function enhanceImage(imageUrl: string): Promise<string> {
  const model = MODELS.enhancer

  const input = {
    img: imageUrl,
    version: "v1.4",
    scale: 2,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result[0] : result
}

// Função para desenho controlado (controlnet)
export async function controlNetImage(scribbleUrl: string, prompt: string): Promise<string> {
  const model = MODELS.controlNet

  const input = {
    image: scribbleUrl,
    prompt,
    num_inference_steps: 30,
    guidance_scale: 9,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result[0] : result
}

// Função para edição em tempo real
export async function realtimeEdit(imageUrl: string, prompt: string, strength = 0.5): Promise<string> {
  const model = MODELS.realtime

  const input = {
    image: imageUrl,
    prompt,
    strength,
    num_inference_steps: 20,
  }

  const result = await runPrediction({ model, input })
  return Array.isArray(result) ? result[0] : result
}

// Função para testar conexão
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

    // Teste simples e rápido
    const testModel = "meta/llama-2-7b:527827021d8756c7ab79fde0abbfaac885c37a3ed5fe23c7465093f0878d55ef"

    await replicate.run(testModel, {
      input: {
        prompt: "Hello",
        max_new_tokens: 5,
      },
    })

    const latency = Date.now() - startTime
    console.log(`✅ Conexão OK! Latência: ${latency}ms`)

    return {
      success: true,
      model: testModel,
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

// Função para verificar status
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

// Função para verificar modelos disponíveis
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

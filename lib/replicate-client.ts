import Replicate from "replicate"

// Configuração do cliente Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export interface ChatMessage {
  role: "system" | "user" | "assistant"
  content: string
  timestamp?: string
}

export interface ChatCompletionOptions {
  temperature?: number
  maxTokens?: number
  topP?: number
  model?: string
}

// Modelos disponíveis no Replicate
export const AVAILABLE_MODELS = {
  llama2_70b: "meta/llama-2-70b-chat:02e509c789964a7ea8736978a43525956ef40397be9033abf9fd2badfe68c9e3",
  llama2_13b: "meta/llama-2-13b-chat:f4e2de70d66816a838a89eeeb621910adffb0dd0baba3976c96980970978018d",
  llama2_7b: "meta/llama-2-7b-chat:8e6975e5ed6174911a6ff3d60540dfd4844201974602551e10e9e87ab143d81e",
  mixtral: "mistralai/mixtral-8x7b-instruct-v0.1:cf18decbf51c27fed6bbdc3492312c1c903222a56e3fe9ca02d6cbe5198afc10",
  custom: process.env.VIRALIZER_MODEL_ID || null,
}

// Expanded image models with names and descriptions
export const AVAILABLE_IMAGE_MODELS = {
  "stable-diffusion-xl": {
    id: "stability-ai/stable-diffusion-xl:39ed52f2a783a8c6c2f95eb30d42310ffcb5f16e3efc1d1b2e2049c668929fb0",
    name: "Stable Diffusion XL",
    description: "Modelo de ponta para geração de imagens de alta qualidade e versatilidade.",
  },
  "sdxl-turbo": {
    id: "stability-ai/sdxl-turbo:37c577ab896a7498a4e189d4549e1bb8532e2452ee4997259a0d292177347545",
    name: "SDXL Turbo",
    description: "Geração de imagens ultrarrápida, ideal para feedback em tempo real.",
  },
  "playground-v2.5": {
    id: "playgroundai/playground-v2.5-aesthetic:e299e0680698333774354573b77c56b6406523d777072336e16a9474e3303d61",
    name: "Playground v2.5",
    description: "Otimizado para estética e qualidade visual, com foco em arte e design.",
  },
  "dalle-3": {
    id: "openai/dall-e-3:635aa08fa53284973efc14647c2ad5234b67993c7745c556e577a20ee02b3fa3",
    name: "DALL-E 3",
    description: "Modelo da OpenAI, excelente para prompts complexos e detalhes finos.",
  },
  "kandinsky-2.2": {
    id: "ai-forever/kandinsky-2.2:ea1addaab376f4dc227f5368bbd8eff901820e178809a1a5360126851903c57d",
    name: "Kandinsky 2.2",
    description: "Modelo russo com foco em estilos artísticos e composições únicas.",
  },
  "custom-image-model": process.env.VIRALIZER_IMAGE_MODEL_ID
    ? {
        id: process.env.VIRALIZER_IMAGE_MODEL_ID,
        name: "Modelo de Imagem Personalizado",
        description: "Seu modelo de imagem personalizado configurado via variável de ambiente.",
      }
    : null,
}

// Prompt do sistema otimizado para o Viralizer
const SYSTEM_PROMPT = `Você é o assistente especializado do Viralizer, uma plataforma de criação de conteúdo para YouTube. 

PERSONALIDADE:
- Tom engraçado na medida certa, profissional, direto e objetivo
- Focado em resultados e otimização
- Especialista em estratégias do YouTube e comportamento de audiência
- Abordagem proativa com sugestões baseadas em dados

ESPECIALIDADES:
1. Consultoria de Conteúdo
   - Análise de tendências do YouTube
   - Sugestões baseadas no histórico do canal
   - Calendário editorial estratégico

2. Otimização para SEO
   - Títulos otimizados para CTR
   - Tags relevantes e estratégicas
   - Descrições completas e envolventes

3. Análise de Performance
   - Feedback sobre thumbnails
   - Comparação com concorrentes
   - Métricas e KPIs importantes

4. Assistência na Criação
   - Brainstorming direcionado
   - Refinamento de ideias
   - Sugestões de elementos visuais

DIRETRIZES:
- Seja prático e ofereça insights acionáveis
- Use dados e tendências para embasar sugestões
- Mantenha foco em resultados mensuráveis
- Seja direto mas amigável e descontraído
- Forneça exemplos concretos quando possível`

export async function getChatCompletion(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<string> {
  try {
    // Verificar se o token está configurado
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN não está configurado nas variáveis de ambiente")
    }

    // Determinar qual modelo usar
    const modelToUse = options.model || AVAILABLE_MODELS.custom || AVAILABLE_MODELS.llama2_70b

    // Preparar o prompt formatado
    const prompt = formatMessagesForReplicate(messages)

    console.log(`🤖 Usando modelo: ${modelToUse}`)

    // Executar a predição
    const output = await replicate.run(modelToUse as any, {
      input: {
        prompt: prompt,
        system_prompt: SYSTEM_PROMPT,
        temperature: options.temperature || 0.7,
        max_new_tokens: options.maxTokens || 1000,
        top_p: options.topP || 0.9,
        repetition_penalty: 1.1,
      },
    })

    // Processar a saída
    const result = Array.isArray(output) ? output.join("") : String(output)

    if (!result || result.trim().length === 0) {
      throw new Error("Modelo retornou resposta vazia")
    }

    return result.trim()
  } catch (error: any) {
    console.error("❌ Erro ao obter resposta do chat:", error)

    // Retornar erro mais específico baseado no tipo
    if (error.message?.includes("REPLICATE_API_TOKEN")) {
      return "❌ Erro de configuração: Token do Replicate não encontrado. Verifique as variáveis de ambiente."
    } else if (error.message?.includes("rate limit")) {
      return "⏱️ Muitas requisições. Aguarde alguns segundos e tente novamente."
    } else if (error.message?.includes("model not found")) {
      return "🤖 Modelo não encontrado. Verificando configuração..."
    } else {
      return "😅 Ops! Algo deu errado por aqui. Que tal tentar reformular sua pergunta? Estou aqui para ajudar com estratégias de YouTube!"
    }
  }
}

// Função para formatar mensagens para o formato esperado pelo Replicate
function formatMessagesForReplicate(messages: ChatMessage[]): string {
  const conversationHistory = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => {
      const role = msg.role === "user" ? "Human" : "Assistant"
      return `${role}: ${msg.content}`
    })
    .join("\n\n")

  return conversationHistory + "\n\nAssistant:"
}

// Função para verificar se o modelo personalizado está disponível
export async function checkCustomModelStatus(): Promise<{
  available: boolean
  modelId: string | null
  error?: string
}> {
  const customModelId = AVAILABLE_MODELS.custom

  if (!customModelId) {
    return {
      available: false,
      modelId: null,
      error: "Modelo personalizado não configurado",
    }
  }

  try {
    // Tentar fazer uma predição simples para verificar se o modelo funciona
    await replicate.run(customModelId as any, {
      input: {
        prompt: "Human: Teste\n\nAssistant:",
        max_new_tokens: 10,
      },
    })

    return {
      available: true,
      modelId: customModelId,
    }
  } catch (error: any) {
    return {
      available: false,
      modelId: customModelId,
      error: error.message,
    }
  }
}

// Função para listar modelos disponíveis
export function getAvailableModels() {
  return Object.entries(AVAILABLE_MODELS)
    .filter(([_, id]) => id !== null)
    .map(([name, id]) => ({
      name,
      id,
      isCustom: name === "custom",
    }))
}

export function getAvailableImageModels() {
  return Object.entries(AVAILABLE_IMAGE_MODELS)
    .filter(([_, modelData]) => modelData !== null)
    .map(([key, modelData]) => ({
      id: (modelData as { id: string }).id,
      name: (modelData as { name: string }).name,
      description: (modelData as { description: string }).description,
      isCustom: key === "custom-image-model",
    }))
}

// Função para testar a conexão com o Replicate
export async function testReplicateConnection(): Promise<{
  success: boolean
  error?: string
  models: string[]
}> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN não configurado")
    }

    // Testar com um modelo simples
    const testOutput = await replicate.run(AVAILABLE_MODELS.llama2_7b as any, {
      input: {
        prompt: "Human: Olá\n\nAssistant:",
        max_new_tokens: 20,
      },
    })

    const availableModels = getAvailableModels().map((m) => m.name)

    return {
      success: true,
      models: availableModels,
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      models: [],
    }
  }
}

export { replicate }

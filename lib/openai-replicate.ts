import Replicate from "replicate"

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
}

const SYSTEM_PROMPT =
  "Você é o assistente especializado do Viralizer, uma plataforma de criação de conteúdo para YouTube. Sua personalidade é: engraçado na medida certa, profissional, direto e objetivo. Foco em resultados e otimização. Especialista em estratégias do YouTube e comportamento de audiência. Sempre seja prático, ofereça insights acionáveis e mantenha o foco em resultados mensuráveis."

export async function getChatCompletion(messages: ChatMessage[], options: ChatCompletionOptions = {}): Promise<string> {
  try {
    // Verificar se o token está configurado
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN não está configurado")
    }

    // Preparar o prompt com o histórico de mensagens
    const conversationHistory = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        const role = msg.role === "user" ? "Human" : "Assistant"
        return `${role}: ${msg.content}`
      })
      .join("\n\n")

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${conversationHistory}`

    // Usar o modelo configurado ou fallback
    const modelId = process.env.VIRALIZER_MODEL_ID || "openai/gpt-4o-mini"

    const output = (await replicate.run(modelId, {
      input: {
        prompt: fullPrompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
      },
    })) as string[]

    // Juntar a resposta se for um array
    if (Array.isArray(output)) {
      return output.join("")
    }

    return output as string
  } catch (error) {
    console.error("Erro no getChatCompletion:", error)
    throw new Error("Falha ao gerar resposta do chat")
  }
}

export async function streamChatCompletion(
  messages: ChatMessage[],
  options: ChatCompletionOptions = {},
): Promise<AsyncIterable<string>> {
  try {
    if (!process.env.REPLICATE_API_TOKEN) {
      throw new Error("REPLICATE_API_TOKEN não está configurado")
    }

    const conversationHistory = messages
      .filter((msg) => msg.role !== "system")
      .map((msg) => {
        const role = msg.role === "user" ? "Human" : "Assistant"
        return `${role}: ${msg.content}`
      })
      .join("\n\n")

    const fullPrompt = `${SYSTEM_PROMPT}\n\n${conversationHistory}`
    const modelId = process.env.VIRALIZER_MODEL_ID || "openai/gpt-4o-mini"

    const stream = await replicate.stream(modelId, {
      input: {
        prompt: fullPrompt,
        max_tokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
      },
    })

    return stream
  } catch (error) {
    console.error("Erro no streamChatCompletion:", error)
    throw new Error("Falha ao criar stream do chat")
  }
}

export { replicate }

import type { Message } from "@/types/chat"
import { getChatCompletion as replicateGetChatCompletion, type ChatMessage } from "./replicate-client"

// Função principal para obter resposta do assistente
export async function getChatCompletion(messages: Message[]): Promise<string> {
  try {
    // Converter mensagens para o formato esperado
    const formattedMessages: ChatMessage[] = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
    }))

    // Obter resposta do Replicate
    const response = await replicateGetChatCompletion(formattedMessages, {
      temperature: 0.7,
      maxTokens: 1000,
      topP: 0.9,
    })

    return response
  } catch (error: any) {
    console.error("Erro no serviço de chat:", error)
    return "Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente."
  }
}

// Função para verificar se o serviço está funcionando
export async function checkChatServiceHealth(): Promise<{
  status: "healthy" | "degraded" | "down"
  message: string
}> {
  try {
    const testMessages: Message[] = [
      {
        id: "test",
        role: "user",
        content: "Teste de conexão",
        timestamp: new Date().toISOString(),
      },
    ]

    const response = await getChatCompletion(testMessages)

    if (response && !response.includes("❌") && !response.includes("Erro")) {
      return {
        status: "healthy",
        message: "Serviço de chat funcionando normalmente",
      }
    } else {
      return {
        status: "degraded",
        message: "Serviço de chat com problemas",
      }
    }
  } catch (error) {
    return {
      status: "down",
      message: "Serviço de chat indisponível",
    }
  }
}

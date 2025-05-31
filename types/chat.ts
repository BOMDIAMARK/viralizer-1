export interface Message {
  role: "user" | "assistant" | "system"
  content: string
  timestamp?: string
}

export interface ChatCompletionInput {
  messages: Message[]
  systemPrompt?: string
  temperature?: number
  maxTokens?: number
}

export interface ChatCompletionResponse {
  message: Message
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

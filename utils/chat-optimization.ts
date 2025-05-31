import type { Message } from "@/types/chat"

/**
 * Otimiza o histórico de mensagens para envio à API
 * @param messages Histórico completo de mensagens
 * @param maxMessages Número máximo de mensagens a incluir
 * @returns Histórico otimizado
 */
export function optimizeChatHistory(messages: Message[], maxMessages = 10): Message[] {
  // Se o histórico for menor que o limite, retornar completo
  if (messages.length <= maxMessages) {
    return messages
  }

  // Incluir sempre a primeira mensagem do sistema (se existir)
  const systemMessage = messages.find((m) => m.role === "system")

  // Pegar as últimas N mensagens
  const recentMessages = messages.slice(-maxMessages)

  // Se houver mensagem do sistema e não estiver nas recentes, adicionar no início
  if (systemMessage && !recentMessages.includes(systemMessage)) {
    return [systemMessage, ...recentMessages]
  }

  return recentMessages
}

/**
 * Função de debounce para evitar múltiplas chamadas
 * @param func Função a ser executada
 * @param wait Tempo de espera em ms
 * @returns Função com debounce
 */
export function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(() => {
      func(...args)
      timeout = null
    }, wait)
  }
}

/**
 * Analisa o contexto da conversa para sugerir próximos passos
 */
export function analyzeConversationContext(messages: Message[]): string[] {
  if (messages.length <= 1) {
    return [
      "Como posso melhorar o SEO dos meus vídeos?",
      "Quais são as tendências atuais no YouTube?",
      "Ajude-me a criar um calendário de conteúdo",
      "Como aumentar meu engajamento?",
    ]
  }

  const lastMessage = messages[messages.length - 1]
  if (lastMessage.role !== "assistant") {
    return []
  }

  const content = lastMessage.content.toLowerCase()

  if (content.includes("seo") || content.includes("otimização")) {
    return [
      "Quais tags devo usar para este vídeo?",
      "Como melhorar meu título?",
      "Ajude-me a escrever uma descrição otimizada",
    ]
  }

  if (content.includes("tendência") || content.includes("trend")) {
    return [
      "Como posso adaptar essa tendência ao meu nicho?",
      "Qual é o melhor momento para publicar?",
      "Que tipo de thumbnail funciona melhor para esse conteúdo?",
    ]
  }

  if (content.includes("thumbnail") || content.includes("miniatura")) {
    return [
      "Que elementos devo incluir na thumbnail?",
      "Quais cores chamam mais atenção?",
      "Como destacar o texto na thumbnail?",
    ]
  }

  if (content.includes("engajamento") || content.includes("interação")) {
    return [
      "Como criar calls-to-action eficazes?",
      "Que tipo de pergunta fazer para gerar comentários?",
      "Como usar cards e end screens?",
    ]
  }

  // Sugestões padrão
  return [
    "Pode me dar mais detalhes sobre isso?",
    "Como posso implementar essas sugestões?",
    "Quais métricas devo acompanhar?",
  ]
}

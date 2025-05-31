"use client"

import { useState, useCallback } from "react"

interface StreamingChatOptions {
  imageUrl?: string
  userId?: string
  rawInput?: any
  onComplete?: (response: string, metadata?: any) => void
  onError?: (error: Error) => void
}

export function useStreamingChat() {
  const [isStreaming, setIsStreaming] = useState(false)
  const [currentResponse, setCurrentResponse] = useState("")

  const clearResponse = useCallback(() => {
    setCurrentResponse("")
  }, [])

  const sendStreamingMessage = useCallback(
    async (message: string, options: StreamingChatOptions = {}) => {
      if (isStreaming) return

      setIsStreaming(true)
      setCurrentResponse("")

      try {
        const requestBody = {
          prompt: message,
          imageInput: options.imageUrl ? [options.imageUrl] : undefined,
          systemPrompt: undefined, // Usar padrão do sistema
          options: {
            context: {
              hasImage: Boolean(options.imageUrl),
              prioritizeQuality: Boolean(options.imageUrl), // Para análise de thumbnails
            },
          },
        }

        const response = await fetch("/api/chat/stream", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Erro na requisição")
        }

        const reader = response.body?.getReader()
        if (!reader) {
          throw new Error("Não foi possível iniciar o streaming")
        }

        let fullResponse = ""
        let metadata = { source: "replicate" }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = new TextDecoder().decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.error) {
                  if (data.fallback) {
                    // Usar fallback local
                    const fallbackResponse = generateFallbackResponse(message, options)
                    setCurrentResponse(fallbackResponse)
                    fullResponse = fallbackResponse
                    metadata = { source: "fallback" }
                    break
                  } else {
                    throw new Error(data.error)
                  }
                }

                if (data.chunk) {
                  fullResponse += data.chunk
                  setCurrentResponse(fullResponse)
                }

                if (data.done) {
                  break
                }
              } catch (parseError) {
                console.warn("Erro ao parsear chunk:", parseError)
              }
            }
          }
        }

        options.onComplete?.(fullResponse, metadata)
      } catch (error: any) {
        console.error("❌ Erro no streaming:", error)

        // Fallback local em caso de erro
        const fallbackResponse = generateFallbackResponse(message, options)
        setCurrentResponse(fallbackResponse)
        options.onComplete?.(fallbackResponse, { source: "fallback" })
        options.onError?.(error)
      } finally {
        setIsStreaming(false)
      }
    },
    [isStreaming],
  )

  return {
    sendStreamingMessage,
    isStreaming,
    currentResponse,
    clearResponse,
  }
}

// Função de fallback para quando o Replicate não está disponível
function generateFallbackResponse(message: string, options: StreamingChatOptions): string {
  const hasImage = Boolean(options.imageUrl)

  if (hasImage) {
    return `📸 **Análise de Thumbnail (Modo Básico)**

Recebi sua imagem para análise! No modo básico, posso oferecer algumas orientações gerais:

🎯 **Dicas Fundamentais para Thumbnails:**
• **Contraste Alto**: Use cores que se destacam no feed
• **Texto Legível**: Máximo 3-4 palavras, fonte grande
• **Expressões Marcantes**: Rostos com emoções claras
• **Regra dos Terços**: Posicione elementos importantes nos pontos de interesse

🚀 **Para análise avançada com IA:**
Configure o REPLICATE_API_TOKEN nas variáveis de ambiente para:
• Análise detalhada de cores e composição
• Sugestões específicas de melhoria
• Comparação com thumbnails de sucesso
• Otimização para diferentes nichos

💡 **Quer uma análise mais detalhada?** Descreva o conteúdo do seu vídeo e posso dar sugestões mais específicas!`
  }

  // Resposta para chat geral
  if (message.toLowerCase().includes("thumbnail")) {
    return `🎨 **Especialista em Thumbnails - Viralizer**

Olá! Sou especializado em ajudar criadores a desenvolver thumbnails que maximizam o CTR (taxa de clique).

🎯 **Como posso ajudar:**
• Análise de thumbnails existentes
• Sugestões de melhoria
• Estratégias de cores e tipografia
• Estilos: Show, Speed, Rico
• Otimização para algoritmo do YouTube

💡 **Dica Rápida:** Uma boa thumbnail deve:
1. Ser legível em tamanho pequeno
2. Despertar curiosidade
3. Representar o conteúdo
4. Ter contraste alto
5. Incluir elementos humanos (quando possível)

🚀 **Para análises avançadas:** Configure o Replicate para usar IA de última geração!

Como posso ajudar com suas thumbnails hoje?`
  }

  return `👋 **BOT Criativo Viralizer**

Olá! Sou especializado em thumbnails para YouTube e estratégias visuais.

🎯 **Minhas especialidades:**
• Análise e otimização de thumbnails
• Estratégias de CTR (taxa de clique)
• Estilos visuais: Show, Speed, Rico
• Psicologia visual e gatilhos de clique

💡 **Como posso ajudar:**
• Envie uma thumbnail para análise
• Peça sugestões para seu nicho
• Tire dúvidas sobre design visual
• Aprenda técnicas de otimização

🚀 **Modo Básico Ativo:** Para análises avançadas com IA, configure o REPLICATE_API_TOKEN.

O que você gostaria de saber sobre thumbnails?`
}

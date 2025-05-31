"use client"

import { Button } from "@/components/ui/button"
import { useChatStore } from "@/stores/chatStore"

interface ContextualSuggestionsProps {
  onSuggestionClick: (suggestion: string) => void
}

export function ContextualSuggestions({ onSuggestionClick }: ContextualSuggestionsProps) {
  const { messages } = useChatStore()

  // Determinar sugestões com base no contexto da conversa
  const getSuggestions = (): string[] => {
    // Se não houver mensagens, mostrar sugestões iniciais
    if (messages.length <= 1) {
      return [
        "Como posso melhorar o SEO dos meus vídeos?",
        "Quais são as tendências atuais no YouTube?",
        "Ajude-me a criar um calendário de conteúdo",
        "Como aumentar meu engajamento?",
      ]
    }

    // Verificar se a última mensagem é do assistente
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role !== "assistant") {
      return []
    }

    // Analisar o conteúdo da última mensagem para sugerir próximos passos
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

    // Sugestões padrão
    return [
      "Pode me dar mais detalhes sobre isso?",
      "Como posso implementar essas sugestões?",
      "Quais métricas devo acompanhar?",
    ]
  }

  const suggestions = getSuggestions()

  if (suggestions.length === 0) {
    return null
  }

  return (
    <div className="mb-4">
      <p className="text-sm text-gray-400 mb-2">Sugestões:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            className="text-xs border-gray-700 bg-gray-800 hover:bg-gray-700"
            onClick={() => onSuggestionClick(suggestion)}
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  )
}

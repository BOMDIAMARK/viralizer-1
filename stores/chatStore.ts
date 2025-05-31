import { create } from "zustand"
import type { Message } from "@/types/chat"
import { createClientClient } from "@/lib/supabase/client"

interface ChatState {
  messages: Message[]
  isLoading: boolean
  hasLoadedHistory: boolean
  error: string | null
  isDemoMode: boolean

  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  sendMessage: (content: string) => Promise<void>
  setIsLoading: (isLoading: boolean) => void
  setHasLoadedHistory: (hasLoaded: boolean) => void
  setError: (error: string | null) => void
  clearMessages: () => void
  setDemoMode: (isDemoMode: boolean) => void
}

// Respostas pré-definidas para o modo de demonstração
const demoResponses: Record<string, string> = {
  default: "Olá! Sou seu assistente especializado em YouTube. Como posso ajudar você hoje?",
  tendências:
    "As tendências atuais no YouTube incluem: vídeos curtos (Shorts), conteúdo educacional, vlogs autênticos, e colaborações entre criadores. Recomendo focar em conteúdo de nicho com alta qualidade de produção.",
  seo: "Para otimizar seu SEO no YouTube, use palavras-chave relevantes no título, descrição e tags. Crie thumbnails atraentes, incentive engajamento e mantenha boa retenção de audiência. Também é importante ter consistência nas postagens.",
  ideias:
    "Algumas ideias de conteúdo que estão funcionando bem: tutoriais passo-a-passo, reações a tendências atuais, desafios criativos, behind-the-scenes do seu processo criativo, e séries temáticas que mantêm os espectadores voltando.",
  thumbnail:
    "Para thumbnails eficazes: use texto grande e legível, contraste de cores, expressões faciais marcantes, e mantenha consistência visual com sua marca. Evite informações em excesso e teste diferentes estilos para ver o que funciona melhor.",
  crescimento:
    "Estratégias para crescer seu canal: poste consistentemente, otimize seus primeiros 15 segundos para retenção, colabore com outros criadores, promova em outras plataformas, e analise seus dados para entender o que ressoa com sua audiência.",
  calendário:
    "Para um calendário editorial eficaz, divida seu conteúdo em categorias (ex: tutoriais às segundas, vlogs às quartas). Planeje com 2-4 semanas de antecedência, reserve tempo para tendências emergentes, e mantenha um buffer de conteúdo para emergências.",
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isLoading: false,
  hasLoadedHistory: false,
  error: null,
  isDemoMode: true, // Iniciar em modo demo para preview

  setMessages: (messages) => set({ messages }),

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  sendMessage: async (content) => {
    const { messages, addMessage, setIsLoading, setError, isDemoMode } = get()

    if (!content.trim()) return

    // Adicionar mensagem do usuário
    const userMessage: Message = {
      role: "user",
      content,
      timestamp: new Date().toISOString(),
    }

    addMessage(userMessage)
    setIsLoading(true)
    setError(null)

    // Modo de demonstração (para preview)
    if (isDemoMode) {
      // Simular um delay de resposta
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Determinar qual resposta usar baseado no conteúdo da mensagem
      let responseContent = demoResponses.default
      const lowerContent = content.toLowerCase()

      if (lowerContent.includes("tendência") || lowerContent.includes("trend")) {
        responseContent = demoResponses.tendências
      } else if (lowerContent.includes("seo") || lowerContent.includes("otimiz")) {
        responseContent = demoResponses.seo
      } else if (lowerContent.includes("ideia") || lowerContent.includes("conteúdo")) {
        responseContent = demoResponses.ideias
      } else if (lowerContent.includes("thumbnail") || lowerContent.includes("miniatura")) {
        responseContent = demoResponses.thumbnail
      } else if (lowerContent.includes("cresc") || lowerContent.includes("inscrit")) {
        responseContent = demoResponses.crescimento
      } else if (lowerContent.includes("calendário") || lowerContent.includes("planej")) {
        responseContent = demoResponses.calendário
      }

      // Adicionar resposta do assistente
      addMessage({
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      })

      setIsLoading(false)
      return
    }

    // Modo normal com autenticação
    try {
      // Verificar autenticação
      const supabase = createClientClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error("Você precisa estar logado para usar o chat. Este é um modo de demonstração.")
      }

      // Salvar mensagem do usuário no Supabase
      await supabase.from("chat_messages").insert({
        user_id: session.user.id,
        role: "user",
        content,
        created_at: userMessage.timestamp,
      })

      // Enviar para a API
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Erro ao obter resposta")
      }

      const data = await response.json()

      // Adicionar resposta do assistente
      addMessage(data.message)
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error)
      setError(error.message || "Erro ao enviar mensagem")

      // Ativar modo de demonstração automaticamente
      set({ isDemoMode: true })

      // Adicionar mensagem explicando o modo de demonstração
      addMessage({
        role: "assistant",
        content:
          "Parece que você não está logado ou houve um problema de autenticação. Estou funcionando em modo de demonstração agora. Você pode continuar testando o chat, mas suas mensagens não serão salvas.",
        timestamp: new Date().toISOString(),
      })
    } finally {
      setIsLoading(false)
    }
  },

  setIsLoading: (isLoading) => set({ isLoading }),

  setHasLoadedHistory: (hasLoadedHistory) => set({ hasLoadedHistory }),

  setError: (error) => set({ error }),

  clearMessages: () => set({ messages: [] }),

  setDemoMode: (isDemoMode) => set({ isDemoMode }),
}))

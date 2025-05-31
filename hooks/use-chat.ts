"use client"

import { useEffect } from "react"
import { useChatStore } from "@/stores/chatStore"
import { createClientClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"

export function useChat() {
  const {
    messages,
    isLoading,
    sendMessage: storeSendMessage,
    setMessages,
    setHasLoadedHistory,
    hasLoadedHistory,
    error,
    isDemoMode,
    setDemoMode,
  } = useChatStore()

  // Verificar autenticação e definir modo de demonstração
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClientClient()
        const {
          data: { session },
        } = await supabase.auth.getSession()

        // Se não estiver logado, ativar modo de demonstração
        if (!session) {
          console.log("Usuário não autenticado, ativando modo de demonstração")
          setDemoMode(true)
          setHasLoadedHistory(true)
          return
        }

        // Se estiver logado, tentar carregar histórico
        const { data, error } = await supabase
          .from("chat_messages")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: true })
          .limit(50)

        if (error) {
          console.error("Erro ao carregar histórico de chat:", error)
          toast({
            title: "Erro",
            description: "Não foi possível carregar o histórico de chat",
            variant: "destructive",
          })
        } else if (data && data.length > 0) {
          // Converter para o formato de mensagens do chat
          const chatMessages = data.map((item) => ({
            role: item.role as "user" | "assistant" | "system",
            content: item.content,
            timestamp: item.created_at,
          }))

          setMessages(chatMessages)
        }

        setDemoMode(false)
        setHasLoadedHistory(true)
      } catch (error) {
        console.error("Erro ao verificar autenticação:", error)
        setDemoMode(true)
        setHasLoadedHistory(true)
      }
    }

    if (!hasLoadedHistory) {
      checkAuth()
    }
  }, [setMessages, setHasLoadedHistory, hasLoadedHistory, setDemoMode])

  // Mostrar toast de erro quando houver erro
  useEffect(() => {
    if (error) {
      toast({
        title: "Erro",
        description: error,
        variant: "destructive",
      })
    }
  }, [error])

  // Função para enviar mensagem (apenas chama o store)
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return
    await storeSendMessage(content)
  }

  // Função para limpar histórico
  const clearHistory = async () => {
    // Em modo de demonstração, apenas limpar mensagens locais
    if (isDemoMode) {
      setMessages([])
      toast({
        title: "Modo de demonstração",
        description: "Histórico local limpo com sucesso",
      })
      return
    }

    try {
      const supabase = createClientClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        toast({
          title: "Erro",
          description: "Você precisa estar logado",
          variant: "destructive",
        })
        return
      }

      const { error } = await supabase.from("chat_messages").delete().eq("user_id", session.user.id)

      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível limpar o histórico",
          variant: "destructive",
        })
      } else {
        setMessages([])
        toast({
          title: "Sucesso",
          description: "Histórico de chat limpo com sucesso",
        })
      }
    } catch (error) {
      console.error("Erro ao limpar histórico:", error)
    }
  }

  return {
    messages,
    isLoading,
    sendMessage,
    clearHistory,
    hasLoadedHistory,
    error,
    isDemoMode,
  }
}

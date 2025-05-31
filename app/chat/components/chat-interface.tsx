"use client"

import { useEffect, useRef, useState } from "react"
import { useChat } from "@/hooks/use-chat"
import { MessageCircle, Sparkles, TrendingUp, Search, Calendar, ImageIcon, BarChart3, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ChatInput } from "./chat-input"
import { ContextualSuggestions } from "./contextual-suggestions"
import { Skeleton } from "@/components/ui/skeleton"
import { createClientClient } from "@/lib/supabase/client"
import { Alert, AlertDescription } from "@/components/ui/alert"

export function ChatInterface() {
  const { messages, isLoading, sendMessage, hasLoadedHistory, isDemoMode } = useChat()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [showWelcome, setShowWelcome] = useState(true)
  const [userName, setUserName] = useState("")

  // Obter nome do usuário
  useEffect(() => {
    const getUserName = async () => {
      const supabase = createClientClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        const { data } = await supabase.from("profiles").select("full_name").eq("id", session.user.id).single()

        if (data?.full_name) {
          setUserName(data.full_name)
        }
      }
    }

    getUserName()
  }, [])

  // Scroll para a última mensagem
  useEffect(() => {
    if (messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
      setShowWelcome(false)
    }
  }, [messages])

  // Sugestões de prompts
  const suggestions = [
    {
      title: "Análise de Tendências",
      description: "Descubra as tendências atuais do YouTube",
      icon: <TrendingUp className="h-6 w-6" />,
      prompt: "Quais são as tendências atuais no YouTube para criadores de conteúdo?",
      gradient: "from-blue-500 to-cyan-400",
    },
    {
      title: "Otimização SEO",
      description: "Melhore seus títulos, tags e descrições",
      icon: <Search className="h-6 w-6" />,
      prompt: "Como posso otimizar o SEO do meu próximo vídeo sobre tecnologia?",
      gradient: "from-green-500 to-emerald-400",
    },
    {
      title: "Ideias de Conteúdo",
      description: "Inspiração para seus próximos vídeos",
      icon: <Sparkles className="h-6 w-6" />,
      prompt: "Preciso de ideias para vídeos sobre produtividade que possam viralizar",
      gradient: "from-purple-500 to-pink-400",
    },
    {
      title: "Análise de Thumbnail",
      description: "Dicas para thumbnails que convertem",
      icon: <ImageIcon className="h-6 w-6" />,
      prompt: "Quais elementos devo incluir na thumbnail para aumentar o CTR?",
      gradient: "from-orange-500 to-red-400",
    },
    {
      title: "Estratégia de Crescimento",
      description: "Acelere o crescimento do seu canal",
      icon: <BarChart3 className="h-6 w-6" />,
      prompt: "Quais estratégias posso usar para crescer meu canal de 1000 para 10000 inscritos?",
      gradient: "from-indigo-500 to-blue-400",
    },
    {
      title: "Calendário Editorial",
      description: "Planeje seu conteúdo com eficiência",
      icon: <Calendar className="h-6 w-6" />,
      prompt: "Ajude-me a criar um calendário editorial para os próximos 30 dias",
      gradient: "from-teal-500 to-blue-400",
    },
  ]

  // Renderizar tela de boas-vindas
  if (showWelcome && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="w-full max-w-3xl mx-auto">
          {/* Alerta de modo de demonstração */}
          {isDemoMode && (
            <Alert className="mb-6 bg-amber-500/10 border-amber-500/50 text-amber-200">
              <Info className="h-4 w-4" />
              <AlertDescription>
                Você está usando o chat em modo de demonstração. As mensagens não serão salvas. Para usar todas as
                funcionalidades, faça login.
              </AlertDescription>
            </Alert>
          )}

          {/* Input centralizado */}
          <div className="relative mb-12">
            <div className="flex items-center p-2 rounded-full border border-gray-700 bg-gray-900 shadow-lg">
              <Textarea
                placeholder="Do que você precisa ajuda hoje?"
                className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-3 px-4 h-12"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    const content = e.currentTarget.value
                    if (content.trim()) {
                      sendMessage(content)
                      e.currentTarget.value = ""
                    }
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="rounded-full h-10 w-10 mr-1"
                onClick={() => {
                  const textarea = document.querySelector("textarea")
                  if (textarea && textarea.value.trim()) {
                    sendMessage(textarea.value)
                    textarea.value = ""
                  }
                }}
              >
                <Sparkles className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Grid de sugestões */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {suggestions.map((suggestion, index) => (
              <Card
                key={index}
                className={cn(
                  "overflow-hidden cursor-pointer transition-all duration-300 hover:scale-105",
                  "border border-gray-800 bg-gradient-to-br",
                  suggestion.gradient,
                )}
                onClick={() => sendMessage(suggestion.prompt)}
              >
                <div className="p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    {suggestion.icon}
                    <h3 className="font-semibold text-lg">{suggestion.title}</h3>
                  </div>
                  <p className="text-sm opacity-90">{suggestion.description}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Seletor de modelo */}
          <div className="mt-8 flex items-center text-gray-400 text-sm">
            <span className="mr-2">Modelo:</span>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs border-gray-700 bg-gray-900">
              ChatGPT <span className="ml-1 opacity-60">▼</span>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Renderizar histórico de mensagens
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-900 rounded-lg border border-gray-800">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500">
            <MessageCircle className="h-5 w-5 text-white" />
          </Avatar>
          <div>
            <h2 className="font-semibold">Assistente YouTube</h2>
            <p className="text-sm text-gray-400">Especialista em estratégias para criadores</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isDemoMode && (
            <span className="text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30">
              Modo Demo
            </span>
          )}
          <Button variant="outline" size="sm" className="border-gray-700" onClick={() => setShowWelcome(true)}>
            Nova Conversa
          </Button>
        </div>
      </div>

      {/* Carregando */}
      {!hasLoadedHistory && (
        <div className="space-y-4 mb-4">
          <Skeleton className="h-12 w-3/4 bg-gray-800" />
          <Skeleton className="h-20 w-full bg-gray-800" />
          <Skeleton className="h-12 w-2/3 ml-auto bg-gray-800" />
          <Skeleton className="h-16 w-full bg-gray-800" />
        </div>
      )}

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4">
        {messages.length > 0 &&
          messages.map((message, index) => {
            // Ignorar mensagens do sistema
            if (message.role === "system") return null

            const isUser = message.role === "user"

            return (
              <div key={index} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg p-4",
                    isUser
                      ? "bg-gradient-to-r from-violet-500 to-purple-500 text-white"
                      : "bg-gray-800 border border-gray-700 text-gray-100",
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm">{isUser ? userName || "Você" : "Assistente"}</span>
                    {message.timestamp && (
                      <span className="text-xs opacity-70">
                        {formatDistanceToNow(new Date(message.timestamp), {
                          addSuffix: true,
                          locale: ptBR,
                        })}
                      </span>
                    )}
                  </div>
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            )
          })}

        {/* Indicador de digitação */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-lg p-4 bg-gray-800 border border-gray-700">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">Assistente</span>
              </div>
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse"></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-150"></span>
                <span className="w-2 h-2 rounded-full bg-gray-400 animate-pulse delay-300"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugestões contextuais */}
      {messages.length > 0 && !isLoading && <ContextualSuggestions onSuggestionClick={sendMessage} />}

      {/* Input de mensagem */}
      <div className="mt-auto">
        <ChatInput onSendMessage={sendMessage} disabled={isLoading} />
      </div>
    </div>
  )
}

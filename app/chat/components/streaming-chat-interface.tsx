"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, ImageIcon, Sparkles, AlertCircle, Settings, Zap, CheckCircle } from "lucide-react"
import { useStreamingChat } from "@/hooks/use-streaming-chat"
import { useAuth } from "@/hooks/use-auth"
import { ReplicateStatusIndicator } from "./replicate-status-indicator"
import { ReplicateConfigBanner } from "./replicate-config-banner"
import { EnvironmentStatus } from "./environment-status"
import { toast } from "sonner"
import { getReplicateConfigStatus, getCurrentModelInfo } from "@/lib/replicate-config"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: string
  imageUrl?: string
  source?: "replicate" | "fallback"
}

export function StreamingChatInterface() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [hasError, setHasError] = useState(false)
  const [replicateActive, setReplicateActive] = useState(false)
  const [configStatus, setConfigStatus] = useState(getReplicateConfigStatus())
  const [currentModel, setCurrentModel] = useState(getCurrentModelInfo())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuth()

  const { sendStreamingMessage, isStreaming, currentResponse, clearResponse } = useStreamingChat()

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, currentResponse])

  // Verificar configuração e status
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const status = getReplicateConfigStatus()
        const model = getCurrentModelInfo()

        setConfigStatus(status)
        setCurrentModel(model)

        if (!status.configured) {
          return
        }

        const response = await fetch("/api/chat/stream")
        const data = await response.json()

        if (data.replicate?.connection?.success) {
          setReplicateActive(true)
          toast.success(`🚀 IA Avançada ativada com ${model.name}!`)
        }
      } catch (error) {
        console.warn("Erro ao verificar configuração:", error)
      }
    }

    checkConfig()
  }, [])

  const handleSendMessage = async () => {
    if (!input.trim() && !imageUrl) return
    if (isStreaming) return

    setHasError(false)

    const userMessage: Message = {
      id: `msg_${Date.now()}_user`,
      role: "user",
      content: input.trim() || "Imagem enviada para análise",
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl || undefined,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setImageUrl("")
    clearResponse()

    // Verificar se é um input bruto para o Replicate
    const isRawInput = input.trim().startsWith("{") && input.trim().endsWith("}")
    let rawInput = null

    if (isRawInput) {
      try {
        rawInput = JSON.parse(input.trim())
        console.log("📦 Detectado input bruto para Replicate:", rawInput)
      } catch (error) {
        console.warn("⚠️ Erro ao parsear input bruto:", error)
      }
    }

    await sendStreamingMessage(userMessage.content, {
      imageUrl: imageUrl || undefined,
      userId: user?.id,
      rawInput: rawInput,
      onComplete: (fullResponse, metadata) => {
        const assistantMessage: Message = {
          id: `msg_${Date.now()}_assistant`,
          role: "assistant",
          content: fullResponse,
          timestamp: new Date().toISOString(),
          source: metadata?.source || "fallback",
        }
        setMessages((prev) => [...prev, assistantMessage])
        clearResponse()

        if (metadata?.source === "replicate") {
          setReplicateActive(true)
          toast.success(`🤖 Resposta gerada com ${currentModel.name}!`)
        } else {
          toast.success("✅ Resposta completa!")
        }
      },
      onError: (error) => {
        console.error("Erro no chat:", error)
        setHasError(true)
        toast.error("Ocorreu um erro, mas ativei o modo offline!")
      },
    })
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleTestReplicate = () => {
    setInput("Teste a conexão com o Replicate e me diga se está funcionando")
    handleSendMessage()
  }

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">BOT Criativo Viralizer</h1>
            <p className="text-sm text-muted-foreground">
              Especialista em thumbnails e estratégias visuais para YouTube
            </p>
          </div>
          <div className="ml-auto flex gap-2">
            {replicateActive && (
              <Badge variant="default" className="flex items-center gap-1 bg-green-600">
                <CheckCircle className="w-3 h-3" />
                {currentModel.name}
              </Badge>
            )}
            {hasError && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Modo Offline
              </Badge>
            )}
            {configStatus.configured && !replicateActive && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Settings className="w-3 h-3" />
                Configurado
              </Badge>
            )}
            {!user && <Badge variant="secondary">Modo Demo</Badge>}
          </div>
        </div>
      </div>

      {/* Banner de configuração */}
      <div className="m-4">
        <ReplicateConfigBanner />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="p-6 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-purple-500" />
              <h3 className="text-lg font-semibold mb-2">Olá! Sou seu BOT Criativo</h3>
              <p className="text-muted-foreground mb-4">
                Estou aqui para ajudar você a criar thumbnails incríveis para o YouTube. Posso analisar imagens, sugerir
                conceitos visuais e orientar sobre estratégias de CTR.
              </p>

              {/* Status do Replicate */}
              <div className="mb-4">
                <ReplicateStatusIndicator />
              </div>

              {/* Status detalhado do ambiente */}
              <div className="mb-4">
                <EnvironmentStatus />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <strong>💡 Conceitos Visuais</strong>
                  <br />
                  Desenvolvo ideias impactantes para suas thumbnails
                </div>
                <div className="p-3 bg-pink-50 dark:bg-pink-950/20 rounded-lg">
                  <strong>📊 Otimização CTR</strong>
                  <br />
                  Analiso e otimizo para maior taxa de clique
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <strong>🎨 Estilos Viralizer</strong>
                  <br />
                  Oriento sobre Show, Speed e Rico
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <strong>🔍 Análise de Imagem</strong>
                  <br />
                  {replicateActive ? `Análise avançada com ${currentModel.name}` : "Análise básica disponível"}
                </div>
              </div>

              {replicateActive && (
                <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-300">
                    <strong>🚀 IA Avançada Ativa!</strong> Usando {currentModel.name} para análises personalizadas,
                    suporte a imagens e respostas mais precisas!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            <Card
              className={`max-w-[80%] ${
                message.role === "user" ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white" : "bg-muted"
              }`}
            >
              <CardContent className="p-4">
                {message.imageUrl && (
                  <div className="mb-3">
                    <img
                      src={message.imageUrl || "/placeholder.svg"}
                      alt="Imagem anexada"
                      className="max-w-full h-auto rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg?height=200&width=300&text=Imagem+não+encontrada"
                      }}
                    />
                  </div>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs opacity-70">{new Date(message.timestamp).toLocaleTimeString()}</p>
                  {message.role === "assistant" && message.source && (
                    <Badge variant="outline" className="text-xs">
                      {message.source === "replicate" ? (
                        <>
                          <Zap className="w-3 h-3 mr-1" />
                          {currentModel.name}
                        </>
                      ) : (
                        <>
                          <Settings className="w-3 h-3 mr-1" />
                          Modo Básico
                        </>
                      )}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {/* Resposta em streaming */}
        {(isStreaming || currentResponse) && (
          <div className="flex justify-start">
            <Card className="max-w-[80%] bg-muted">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    {hasError
                      ? "Modo offline ativo..."
                      : replicateActive
                        ? `${currentModel.name} pensando...`
                        : "Digitando..."}
                  </span>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{currentResponse}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-background">
        {imageUrl && (
          <div className="mb-3 p-2 bg-muted rounded-lg flex items-center gap-2">
            <ImageIcon className="w-4 h-4" />
            <span className="text-sm truncate flex-1">{imageUrl}</span>
            <Button variant="ghost" size="sm" onClick={() => setImageUrl("")}>
              ✕
            </Button>
          </div>
        )}

        <div className="flex gap-2">
          <div className="flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                replicateActive
                  ? `Digite sua mensagem sobre thumbnails (${currentModel.name} ativo)...`
                  : "Digite sua mensagem (configure Replicate para IA avançada)..."
              }
              className="min-h-[60px] resize-none"
              disabled={isStreaming}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = prompt("Cole a URL da imagem:")
                if (url) setImageUrl(url)
              }}
              disabled={isStreaming}
            >
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button onClick={handleSendMessage} disabled={(!input.trim() && !imageUrl) || isStreaming} size="sm">
              {isStreaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-2 text-center">
          {user ? "Suas conversas são salvas automaticamente" : "Modo demo - faça login para salvar suas conversas"}
          {replicateActive && ` • ${currentModel.name} ativo`}
        </p>
      </div>
    </div>
  )
}

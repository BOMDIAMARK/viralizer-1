"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal, Paperclip, Mic } from "lucide-react"

interface ChatInputProps {
  onSendMessage: (content: string) => void
  disabled?: boolean
}

export function ChatInput({ onSendMessage, disabled = false }: ChatInputProps) {
  const [message, setMessage] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [message])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!message.trim() || disabled) return

    onSendMessage(message)
    setMessage("")

    // Resetar altura do textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enviar com Enter (sem Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative">
      <div className="flex items-end rounded-lg border border-gray-700 bg-gray-900 p-2">
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={disabled}>
          <Paperclip className="h-4 w-4" />
          <span className="sr-only">Anexar arquivo</span>
        </Button>

        <Textarea
          ref={textareaRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Digite sua mensagem..."
          disabled={disabled}
          className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 resize-none py-2 px-3 min-h-[40px] max-h-[200px]"
        />

        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 rounded-full" disabled={disabled}>
          <Mic className="h-4 w-4" />
          <span className="sr-only">Mensagem de voz</span>
        </Button>

        <Button
          type="submit"
          size="icon"
          className={`h-8 w-8 rounded-full ${!message.trim() || disabled ? "opacity-50" : "bg-gradient-to-r from-violet-500 to-purple-500"}`}
          disabled={!message.trim() || disabled}
        >
          <SendHorizontal className="h-4 w-4" />
          <span className="sr-only">Enviar mensagem</span>
        </Button>
      </div>
    </form>
  )
}

import React from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { Message } from "@/types/chat"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { User, Bot } from "lucide-react"

interface MessageBubbleProps {
  message: Message
  isUser: boolean
  isTyping?: boolean
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isUser, isTyping = false }) => {
  // Ignorar mensagens do sistema na interface
  if (message.role === "system") return null

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src="/images/assistant-avatar.png" alt="Assistente" />
          <AvatarFallback>
            <Bot className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}

      <div className={cn("max-w-[80%] rounded-lg p-3", isUser ? "bg-primary text-primary-foreground" : "bg-muted")}>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{isUser ? "Você" : "Assistente"}</span>
          {message.timestamp && (
            <span className="text-xs opacity-70">{format(new Date(message.timestamp), "HH:mm", { locale: ptBR })}</span>
          )}
        </div>

        <div className="message-text">
          {isTyping ? (
            <div className="flex gap-1 items-center">
              <span className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
              <span
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></span>
              <span
                className="w-2 h-2 bg-current rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></span>
            </div>
          ) : (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              {message.content.split("\n").map((line, i) => (
                <React.Fragment key={i}>
                  {line}
                  {i < message.content.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {isUser && (
        <Avatar className="h-8 w-8">
          <AvatarFallback>
            <User className="h-4 w-4" />
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  )
}

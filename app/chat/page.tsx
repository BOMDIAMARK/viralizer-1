import { StreamingChatInterface } from "./components/streaming-chat-interface"

export const metadata = {
  title: "Chat com BOT Criativo | Viralizer",
  description:
    "Converse com o BOT Criativo da Viralizer para obter ideias e estratégias para suas thumbnails do YouTube",
}

export default function ChatPage() {
  return (
    <div className="container mx-auto py-6 h-[calc(100vh-80px)]">
      <StreamingChatInterface />
    </div>
  )
}

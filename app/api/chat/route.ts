import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { getChatCompletion } from "@/lib/chat-service"
import type { Message } from "@/types/chat"

export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json()

    // Validar entrada
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Mensagens são obrigatórias" }, { status: 400 })
    }

    // Verificar autenticação (opcional para modo demo)
    const supabase = createClient()
    let user = null

    try {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()
      user = authUser
    } catch (authError) {
      console.log("Usuário não autenticado, usando modo demo")
    }

    // Se não há usuário e não foi fornecido userId, usar modo demo
    const isDemo = !user && !userId
    const effectiveUserId = user?.id || userId || "demo-user"

    console.log(`💬 Processando mensagem para usuário: ${effectiveUserId} ${isDemo ? "(modo demo)" : ""}`)

    // Obter resposta do assistente
    const assistantResponse = await getChatCompletion(messages)

    // Criar mensagem de resposta
    const responseMessage: Message = {
      id: `msg_${Date.now()}_assistant`,
      role: "assistant",
      content: assistantResponse,
      timestamp: new Date().toISOString(),
      userId: effectiveUserId,
    }

    // Salvar no banco apenas se não for modo demo
    if (!isDemo && user) {
      try {
        // Salvar mensagem do usuário
        const userMessage = messages[messages.length - 1]
        if (userMessage) {
          await supabase.from("messages").insert({
            id: userMessage.id,
            user_id: user.id,
            role: userMessage.role,
            content: userMessage.content,
            timestamp: userMessage.timestamp,
          })
        }

        // Salvar resposta do assistente
        await supabase.from("messages").insert({
          id: responseMessage.id,
          user_id: user.id,
          role: responseMessage.role,
          content: responseMessage.content,
          timestamp: responseMessage.timestamp,
        })

        console.log("✅ Mensagens salvas no banco de dados")
      } catch (dbError) {
        console.error("❌ Erro ao salvar no banco:", dbError)
        // Não falhar a requisição por erro de banco
      }
    }

    return NextResponse.json({
      message: responseMessage,
      isDemo,
    })
  } catch (error: any) {
    console.error("❌ Erro na API de chat:", error)

    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}

// Endpoint para verificar saúde do serviço
export async function GET() {
  try {
    const { checkChatServiceHealth } = await import("@/lib/chat-service")
    const health = await checkChatServiceHealth()

    return NextResponse.json(health)
  } catch (error: any) {
    return NextResponse.json(
      {
        status: "down",
        message: "Erro ao verificar saúde do serviço",
        error: error.message,
      },
      { status: 500 },
    )
  }
}

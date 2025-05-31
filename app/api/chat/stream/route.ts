import { type NextRequest, NextResponse } from "next/server"
import { streamReplicateCompletion, testReplicateConnection, getReplicateStatus } from "@/lib/replicate-service"

// Respostas de fallback aprimoradas
const DEMO_RESPONSES = {
  thumbnails: [
    "🎨 **Análise de Thumbnail Concluída!**\n\nPara criar thumbnails que convertem, foque em:\n\n• **Contraste visual forte** - Use cores que se destacam no feed\n• **Expressões faciais marcantes** - Emoções geram cliques\n• **Texto legível** - Máximo 3-4 palavras em fonte grande\n• **Regra dos terços** - Posicione elementos importantes nos pontos de intersecção\n\n💡 **Dica Viralizer**: Teste sempre 2-3 versões diferentes e analise qual performa melhor!\n\n🔧 *Resposta gerada pelo sistema de fallback - configure o Replicate para análises mais avançadas.*",

    "🚀 **Estratégia de CTR Otimizada!**\n\nSuas thumbnails precisam:\n\n• **Curiosidade** - Crie um 'gap' de informação\n• **Urgência visual** - Use elementos que transmitam ação\n• **Consistência** - Mantenha identidade visual do canal\n• **Teste A/B** - Compare performance entre versões\n\n🎯 **Meta**: CTR acima de 10% é excelente para a maioria dos nichos!\n\n🔧 *Para análises personalizadas, configure sua API do Replicate.*",

    "✨ **Conceito Visual Desenvolvido!**\n\nPara seu vídeo, sugiro:\n\n• **Estilo Show**: Foco na sua expressão + elemento visual impactante\n• **Paleta de cores**: Azul/laranja para contraste máximo\n• **Composição**: Você ocupando 60% + texto/elemento 40%\n• **Call-to-action visual**: Seta ou destaque no elemento principal\n\n🔥 **Lembre-se**: Sua thumbnail compete com centenas de outras no feed!\n\n🔧 *Modo demonstração ativo - conecte o Replicate para sugestões personalizadas.*",
  ],

  general: [
    "👋 **Olá! Sou o BOT Criativo da Viralizer!**\n\nEstou aqui para transformar suas ideias em thumbnails virais. Posso ajudar com:\n\n• **Análise de thumbnails existentes**\n• **Conceitos visuais impactantes**\n• **Otimização para CTR**\n• **Estratégias de consistência visual**\n\nComo posso amplificar seu conteúdo hoje? 🚀\n\n🔧 *Atualmente em modo demonstração. Para análises avançadas com IA, configure o Replicate.*",

    "🎯 **Vamos criar algo autêntico!**\n\nPara thumbnails que destacam seu canal:\n\n• **Defina sua identidade visual** - Cores, fontes, estilo\n• **Conheça sua audiência** - O que gera curiosidade neles?\n• **Analise a concorrência** - O que funciona no seu nicho?\n• **Teste constantemente** - Dados não mentem!\n\n💡 **Próximo passo**: Me conte sobre seu canal e vamos criar uma estratégia personalizada!\n\n🔧 *Modo básico ativo. Configure REPLICATE_API_TOKEN para respostas mais inteligentes.*",
  ],

  configuration: [
    "⚙️ **Configuração do Replicate**\n\nPara ativar o modo avançado com IA:\n\n1. **Obtenha sua API Key** em replicate.com\n2. **Configure a variável**: `REPLICATE_API_TOKEN=r8_sua_key`\n3. **Reinicie a aplicação**\n\n**Opcional para recursos avançados:**\n• `VIRALIZER_MODEL_ID` - Para modelo personalizado\n• `REPLICATE_USERNAME` - Para recursos de usuário\n\n🚀 **Após configurar**: Você terá acesso a análises de IA avançadas, suporte a imagens e respostas personalizadas!\n\n💡 **Por enquanto**: Estou funcionando em modo demonstração com respostas pré-definidas.",
  ],

  error: [
    "⚠️ **Modo Fallback Ativado**\n\nDetectei um problema de conexão com o serviço de IA. Estou funcionando em modo básico agora.\n\nPosso ajudar com:\n\n• **Conceitos básicos de thumbnails**\n• **Dicas gerais de CTR**\n• **Orientações sobre composição visual**\n\nPara análises avançadas e personalizadas, será necessário verificar a conexão com o Replicate.\n\n💡 **Dica**: Verifique se o `REPLICATE_API_TOKEN` está configurado corretamente e se há conectividade com a internet.",
  ],
}

function getRandomResponse(category: "thumbnails" | "general" | "configuration" | "error" = "general"): string {
  const responses = DEMO_RESPONSES[category]
  return responses[Math.floor(Math.random() * responses.length)]
}

function simulateTypingDelay(text: string): string[] {
  const words = text.split(" ")
  const chunks: string[] = []
  let currentChunk = ""

  for (let i = 0; i < words.length; i++) {
    currentChunk += (i === 0 ? "" : " ") + words[i]

    if (i % 4 === 3 || words[i].includes("\n") || i === words.length - 1) {
      chunks.push(currentChunk)
      currentChunk = ""
    }
  }

  return chunks.filter((chunk) => chunk.trim().length > 0)
}

export async function GET() {
  try {
    // Retornar status do Replicate
    const status = getReplicateStatus()

    // Se configurado, testar conexão
    let connection = null
    if (status.configured) {
      try {
        connection = await Promise.race([
          testReplicateConnection(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
        ])
      } catch (error: any) {
        connection = {
          success: false,
          error: error.message,
          configured: status.configured,
        }
      }
    }

    return NextResponse.json({
      replicate: {
        ...status,
        connection,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error("❌ Erro na API de status:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, imageInput, systemPrompt, options = {} } = body

    if (!prompt) {
      return NextResponse.json({ error: "Prompt é obrigatório" }, { status: 400 })
    }

    // Verificar se Replicate está configurado
    const status = getReplicateStatus()
    if (!status.configured) {
      return NextResponse.json(
        {
          error: "Replicate não configurado",
          fallback: true,
          message: "Configure REPLICATE_API_TOKEN para usar IA avançada",
        },
        { status: 503 },
      )
    }

    // Configurar streaming
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const streamOptions = {
            prompt,
            imageInput,
            systemPrompt,
            ...options,
          }

          for await (const chunk of streamReplicateCompletion(streamOptions)) {
            const data = encoder.encode(`data: ${JSON.stringify({ chunk })}\n\n`)
            controller.enqueue(data)
          }

          // Finalizar stream
          const endData = encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
          controller.enqueue(endData)
          controller.close()
        } catch (error: any) {
          console.error("❌ Erro no streaming:", error)

          const errorData = encoder.encode(
            `data: ${JSON.stringify({
              error: error.message,
              fallback: true,
            })}\n\n`,
          )
          controller.enqueue(errorData)
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error: any) {
    console.error("❌ Erro na API de chat:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

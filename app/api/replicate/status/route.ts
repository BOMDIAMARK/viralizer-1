import { NextResponse } from "next/server"
import { getReplicateStatus, testReplicateConnection, checkModelAvailability } from "@/lib/replicate-service"

export async function GET() {
  try {
    console.log("🔍 Verificando status completo do Replicate...")

    // 1. Status básico da configuração
    const basicStatus = getReplicateStatus()

    // 2. Teste de conectividade (com timeout)
    let connectionTest = null
    if (basicStatus.configured) {
      try {
        connectionTest = await Promise.race([
          testReplicateConnection(),
          new Promise<any>((_, reject) => setTimeout(() => reject(new Error("Timeout na conexão")), 8000)),
        ])
      } catch (error: any) {
        connectionTest = {
          success: false,
          error: error.message,
          latency: 0,
          configured: basicStatus.configured,
        }
      }
    }

    // 3. Verificação de modelos (opcional)
    let modelCheck = null
    if (connectionTest?.success) {
      try {
        modelCheck = await Promise.race([
          checkModelAvailability(),
          new Promise<any>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout na verificação de modelos")), 5000),
          ),
        ])
      } catch (error: any) {
        console.warn("⚠️ Erro ao verificar modelos:", error.message)
        modelCheck = {
          available: [],
          recommended: "fallback",
          error: error.message,
        }
      }
    }

    // 4. Compilar resposta completa
    const response = {
      timestamp: new Date().toISOString(),
      service: "Viralizer Replicate Integration",
      status: basicStatus.configured && connectionTest?.success ? "healthy" : "partial",

      configuration: {
        hasToken: basicStatus.hasToken,
        hasCustomModel: basicStatus.hasCustomModel,
        hasUsername: basicStatus.hasUsername,
        customModelId: basicStatus.customModelId,
        clientInitialized: basicStatus.client,
      },

      connectivity: connectionTest || {
        success: false,
        error: "Não testado - token não configurado",
        configured: basicStatus.configured,
      },

      models: modelCheck || {
        available: [],
        recommended: "not-tested",
        error: "Não testado - conexão não estabelecida",
      },

      recommendations: generateRecommendations(basicStatus, connectionTest, modelCheck),
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error("❌ Erro na API de status:", error)

    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        service: "Viralizer Replicate Integration",
        status: "error",
        error: error.message,
        configuration: {
          hasToken: Boolean(process.env.REPLICATE_API_TOKEN),
          hasCustomModel: Boolean(process.env.VIRALIZER_MODEL_ID),
          hasUsername: Boolean(process.env.REPLICATE_USERNAME),
        },
      },
      { status: 500 },
    )
  }
}

function generateRecommendations(basicStatus: any, connectionTest: any, modelCheck: any) {
  const recommendations = []

  if (!basicStatus.hasToken) {
    recommendations.push({
      type: "critical",
      message: "Configure REPLICATE_API_TOKEN para ativar IA avançada",
      action: "Adicione sua API key do Replicate nas variáveis de ambiente",
    })
  }

  if (basicStatus.hasToken && !connectionTest?.success) {
    recommendations.push({
      type: "warning",
      message: "Token configurado mas conexão falhou",
      action: "Verifique se o token está correto e se há conectividade com a internet",
    })
  }

  if (!basicStatus.hasCustomModel && connectionTest?.success) {
    recommendations.push({
      type: "info",
      message: "Configure um modelo personalizado para melhor performance",
      action: "Adicione VIRALIZER_MODEL_ID=openai/gpt-4o-mini para começar",
    })
  }

  if (!basicStatus.hasUsername) {
    recommendations.push({
      type: "info",
      message: "Configure REPLICATE_USERNAME para recursos avançados",
      action: "Adicione seu nome de usuário do Replicate (opcional)",
    })
  }

  if (connectionTest?.success && modelCheck?.available?.length > 0) {
    recommendations.push({
      type: "success",
      message: "Configuração completa! Todas as funcionalidades estão disponíveis",
      action: "Teste o chat em /chat ou envie uma thumbnail para análise",
    })
  }

  return recommendations
}

export async function POST() {
  return NextResponse.json({ error: "Método não permitido. Use GET para verificar status." }, { status: 405 })
}

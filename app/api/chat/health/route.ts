// Endpoint de diagnóstico para verificar saúde do Replicate
import { NextResponse } from "next/server"
import { getReplicateStatus } from "@/lib/replicate-service"

export async function GET() {
  try {
    const replicateStatus = getReplicateStatus()

    // Verificação básica sem fazer chamadas externas
    const basicCheck = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      replicate: {
        configured: Boolean(process.env.REPLICATE_API_TOKEN),
        customModel: Boolean(process.env.VIRALIZER_MODEL_ID),
        models: Object.keys(replicateStatus.availableModels || {}).length,
      },
      status: "ok",
    }

    return NextResponse.json(basicCheck)
  } catch (error: any) {
    return NextResponse.json(
      {
        error: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString(),
        status: "error",
      },
      { status: 500 },
    )
  }
}

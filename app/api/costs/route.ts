import { createServerClient } from "@/lib/supabase/server"
import { getModelCost, convertToBRL } from "@/lib/cost-config"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createServerClient()

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // Calcular data de 7 dias atrás
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  // Buscar imagens dos últimos 7 dias
  const { data: images, error: imagesError } = await supabase
    .from("images")
    .select("id, model, style, created_at, metadata")
    .eq("user_id", session.user.id)
    .gte("created_at", sevenDaysAgo.toISOString())
    .order("created_at", { ascending: true })

  if (imagesError) {
    console.error("Erro ao buscar imagens para custos:", imagesError)
    return NextResponse.json({ error: "Erro ao buscar dados de custos" }, { status: 500 })
  }

  // Agrupar por dia e modelo
  const dailyCosts: Record<
    string,
    {
      date: string
      totalUSD: number
      totalBRL: number
      count: number
      byModel: Record<string, { count: number; costUSD: number; costBRL: number }>
    }
  > = {}

  // Inicializar todos os 7 dias (mesmo sem dados)
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateKey = date.toISOString().split("T")[0]
    dailyCosts[dateKey] = {
      date: dateKey,
      totalUSD: 0,
      totalBRL: 0,
      count: 0,
      byModel: {},
    }
  }

  // Totais por modelo
  const modelTotals: Record<string, { count: number; costUSD: number; costBRL: number; name: string }> = {}

  // Processar imagens
  for (const image of images || []) {
    const dateKey = image.created_at ? image.created_at.split("T")[0] : ""
    if (!dateKey || !dailyCosts[dateKey]) continue

    const modelId = image.model || "flux-dev"
    const modelCost = getModelCost(modelId)
    const costUSD = modelCost.costPerUnit
    const costBRL = convertToBRL(costUSD)

    // Agregar por dia
    dailyCosts[dateKey].totalUSD += costUSD
    dailyCosts[dateKey].totalBRL += costBRL
    dailyCosts[dateKey].count += 1

    if (!dailyCosts[dateKey].byModel[modelId]) {
      dailyCosts[dateKey].byModel[modelId] = { count: 0, costUSD: 0, costBRL: 0 }
    }
    dailyCosts[dateKey].byModel[modelId].count += 1
    dailyCosts[dateKey].byModel[modelId].costUSD += costUSD
    dailyCosts[dateKey].byModel[modelId].costBRL += costBRL

    // Agregar totais por modelo
    if (!modelTotals[modelId]) {
      modelTotals[modelId] = { count: 0, costUSD: 0, costBRL: 0, name: modelCost.name }
    }
    modelTotals[modelId].count += 1
    modelTotals[modelId].costUSD += costUSD
    modelTotals[modelId].costBRL += costBRL
  }

  // Calcular totais gerais
  const totalUSD = Object.values(dailyCosts).reduce((acc, day) => acc + day.totalUSD, 0)
  const totalBRL = convertToBRL(totalUSD)
  const totalImages = Object.values(dailyCosts).reduce((acc, day) => acc + day.count, 0)

  return NextResponse.json({
    period: {
      start: sevenDaysAgo.toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
    summary: {
      totalUSD: Math.round(totalUSD * 1000) / 1000,
      totalBRL: Math.round(totalBRL * 100) / 100,
      totalImages,
      avgCostPerImageUSD: totalImages > 0 ? Math.round((totalUSD / totalImages) * 1000) / 1000 : 0,
      avgCostPerImageBRL: totalImages > 0 ? Math.round((totalBRL / totalImages) * 100) / 100 : 0,
    },
    daily: Object.values(dailyCosts).map((day) => ({
      ...day,
      totalUSD: Math.round(day.totalUSD * 1000) / 1000,
      totalBRL: Math.round(day.totalBRL * 100) / 100,
    })),
    byModel: Object.entries(modelTotals).map(([id, data]) => ({
      id,
      name: data.name,
      count: data.count,
      costUSD: Math.round(data.costUSD * 1000) / 1000,
      costBRL: Math.round(data.costBRL * 100) / 100,
    })),
  })
}

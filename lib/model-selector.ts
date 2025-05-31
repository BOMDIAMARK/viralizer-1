// Utilitário para seleção inteligente de modelos
export interface ModelCapability {
  vision: boolean
  streaming: boolean
  maxTokens: number
  costTier: "low" | "medium" | "high"
  speed: "fast" | "medium" | "slow"
  quality: "good" | "excellent" | "premium"
}

export const MODEL_CAPABILITIES: Record<string, ModelCapability> = {
  "openai/gpt-4o": {
    vision: true,
    streaming: true,
    maxTokens: 4096,
    costTier: "high",
    speed: "medium",
    quality: "premium",
  },
  "openai/gpt-4o-mini": {
    vision: true,
    streaming: true,
    maxTokens: 4096,
    costTier: "low",
    speed: "fast",
    quality: "excellent",
  },
  "openai/gpt-4-vision-preview": {
    vision: true,
    streaming: true,
    maxTokens: 4096,
    costTier: "high",
    speed: "slow",
    quality: "premium",
  },
  "meta/llama-2-70b-chat": {
    vision: false,
    streaming: true,
    maxTokens: 2048,
    costTier: "medium",
    speed: "medium",
    quality: "excellent",
  },
  "mistralai/mixtral-8x7b-instruct-v0.1": {
    vision: false,
    streaming: true,
    maxTokens: 2048,
    costTier: "medium",
    speed: "fast",
    quality: "excellent",
  },
}

export function selectBestModel(requirements: {
  needsVision?: boolean
  prioritizeCost?: boolean
  prioritizeSpeed?: boolean
  prioritizeQuality?: boolean
}): string {
  const availableModels = Object.entries(MODEL_CAPABILITIES)

  // Filtrar por requisitos obrigatórios
  const candidates = availableModels.filter(([_, caps]) => {
    if (requirements.needsVision && !caps.vision) return false
    return true
  })

  if (candidates.length === 0) {
    return "openai/gpt-4o-mini" // Fallback seguro
  }

  // Ordenar por prioridades
  candidates.sort(([aId, aCaps], [bId, bCaps]) => {
    let scoreA = 0
    let scoreB = 0

    if (requirements.prioritizeCost) {
      const costScores = { low: 3, medium: 2, high: 1 }
      scoreA += costScores[aCaps.costTier]
      scoreB += costScores[bCaps.costTier]
    }

    if (requirements.prioritizeSpeed) {
      const speedScores = { fast: 3, medium: 2, slow: 1 }
      scoreA += speedScores[aCaps.speed]
      scoreB += speedScores[bCaps.speed]
    }

    if (requirements.prioritizeQuality) {
      const qualityScores = { good: 1, excellent: 2, premium: 3 }
      scoreA += qualityScores[aCaps.quality]
      scoreB += qualityScores[bCaps.quality]
    }

    return scoreB - scoreA
  })

  return candidates[0][0]
}

export function getModelInfo(modelId: string): ModelCapability | null {
  return MODEL_CAPABILITIES[modelId] || null
}

export function getRecommendedModels() {
  return {
    // Para análise de thumbnails (precisa de visão)
    thumbnailAnalysis: selectBestModel({
      needsVision: true,
      prioritizeQuality: true,
    }),

    // Para chat geral (custo-benefício)
    generalChat: selectBestModel({
      prioritizeCost: true,
      prioritizeSpeed: true,
    }),

    // Para análise criativa (qualidade máxima)
    creativeAnalysis: selectBestModel({
      prioritizeQuality: true,
    }),

    // Para respostas rápidas (velocidade)
    quickResponse: selectBestModel({
      prioritizeSpeed: true,
      prioritizeCost: true,
    }),
  }
}

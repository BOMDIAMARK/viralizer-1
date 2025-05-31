// Utilitários para configuração do Replicate
export function isReplicateConfiguredOnClient(): boolean {
  return process.env.NEXT_PUBLIC_REPLICATE_CONFIGURED === "true"
}

export function getReplicateConfigStatus() {
  return {
    configured: isReplicateConfiguredOnClient(),
    hasCustomModel: Boolean(process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID),
    hasUsername: Boolean(process.env.NEXT_PUBLIC_REPLICATE_USERNAME),
    customModelId: process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID || null,
    username: process.env.NEXT_PUBLIC_REPLICATE_USERNAME || null,
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  }
}

// Modelos recomendados baseados no uso - EXPORTAÇÃO ADICIONADA
export const RECOMMENDED_MODELS = {
  thumbnailAnalysis: {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Melhor para análise de thumbnails com visão",
    features: ["Análise de imagem", "Alta qualidade", "Respostas detalhadas"],
    costTier: "Alto",
    speed: "Médio",
  },
  generalChat: {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Ideal para chat geral com ótimo custo-benefício",
    features: ["Análise de imagem", "Velocidade rápida", "Baixo custo"],
    costTier: "Baixo",
    speed: "Rápido",
  },
  creativeAnalysis: {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    description: "Para análises criativas e conceituais avançadas",
    features: ["Máxima qualidade", "Criatividade", "Análise profunda"],
    costTier: "Alto",
    speed: "Médio",
  },
  quickResponse: {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mixtral 8x7B",
    description: "Para respostas rápidas e eficientes",
    features: ["Velocidade máxima", "Baixo custo", "Boa qualidade"],
    costTier: "Baixo",
    speed: "Muito Rápido",
  },
} as const

export function getRecommendedModelForUse(useCase: keyof typeof RECOMMENDED_MODELS) {
  return RECOMMENDED_MODELS[useCase]
}

export function getCurrentModelInfo() {
  const customModelId = process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID

  if (customModelId) {
    // Verificar se é um dos modelos conhecidos
    const knownModel = Object.values(RECOMMENDED_MODELS).find((model) => model.id === customModelId)

    if (knownModel) {
      return {
        ...knownModel,
        isCustom: true,
        configured: true,
      }
    }

    // Modelo personalizado desconhecido
    return {
      id: customModelId,
      name: "Modelo Personalizado",
      description: "Modelo configurado pelo usuário",
      features: ["Configuração personalizada"],
      costTier: "Desconhecido",
      speed: "Desconhecido",
      isCustom: true,
      configured: true,
    }
  }

  // Modelo padrão
  return {
    ...RECOMMENDED_MODELS.generalChat,
    isCustom: false,
    configured: false,
  }
}

export function shouldShowReplicateSetup(): boolean {
  return !isReplicateConfiguredOnClient()
}

// Função para verificar se todas as variáveis necessárias estão configuradas
export function getRequiredEnvironmentVariables() {
  const required = [
    {
      name: "REPLICATE_API_TOKEN",
      configured: isReplicateConfiguredOnClient(),
      description: "Token de API do Replicate para IA avançada",
      required: true,
      status: isReplicateConfiguredOnClient() ? "✅ Configurado" : "❌ Necessário",
    },
    {
      name: "VIRALIZER_MODEL_ID",
      configured: Boolean(process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID),
      description: "ID do modelo personalizado (recomendado)",
      required: false,
      value: process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID || "Não configurado",
      status: Boolean(process.env.NEXT_PUBLIC_VIRALIZER_MODEL_ID) ? "✅ Configurado" : "⚠️ Opcional",
    },
    {
      name: "REPLICATE_USERNAME",
      configured: Boolean(process.env.NEXT_PUBLIC_REPLICATE_USERNAME),
      description: "Nome de usuário do Replicate (opcional)",
      required: false,
      value: process.env.NEXT_PUBLIC_REPLICATE_USERNAME || "Não configurado",
      status: Boolean(process.env.NEXT_PUBLIC_REPLICATE_USERNAME) ? "✅ Configurado" : "⚠️ Opcional",
    },
  ]

  return {
    variables: required,
    allRequired: required.filter((v) => v.required).every((v) => v.configured),
    missing: required.filter((v) => v.required && !v.configured),
    optional: required.filter((v) => !v.required && !v.configured),
    configured: required.filter((v) => v.configured),
  }
}

// Configuração de custos estimados por modelo/serviço (em USD)
export interface ModelCost {
  id: string
  name: string
  provider: string
  costPerUnit: number // custo por chamada/imagem em USD
  unit: string
  category: "image" | "chat" | "training"
}

export const MODEL_COSTS: Record<string, ModelCost> = {
  // FAL.ai - Geração de Imagens
  "flux-pro": {
    id: "flux-pro",
    name: "Flux Pro",
    provider: "FAL.ai",
    costPerUnit: 0.05,
    unit: "imagem",
    category: "image",
  },
  "flux-dev": {
    id: "flux-dev",
    name: "Flux Dev",
    provider: "FAL.ai",
    costPerUnit: 0.025,
    unit: "imagem",
    category: "image",
  },
  "flux-schnell": {
    id: "flux-schnell",
    name: "Flux Schnell",
    provider: "FAL.ai",
    costPerUnit: 0.003,
    unit: "imagem",
    category: "image",
  },
  "flux-lora": {
    id: "flux-lora",
    name: "Flux LoRA",
    provider: "FAL.ai",
    costPerUnit: 0.025,
    unit: "imagem",
    category: "image",
  },
  simulation: {
    id: "simulation",
    name: "Simulação",
    provider: "Local",
    costPerUnit: 0,
    unit: "imagem",
    category: "image",
  },
  // Replicate/OpenAI - Chat e Análise
  "openai/gpt-4o": {
    id: "openai/gpt-4o",
    name: "GPT-4o",
    provider: "OpenAI",
    costPerUnit: 0.01,
    unit: "requisição",
    category: "chat",
  },
  "openai/gpt-4o-mini": {
    id: "openai/gpt-4o-mini",
    name: "GPT-4o Mini",
    provider: "OpenAI",
    costPerUnit: 0.001,
    unit: "requisição",
    category: "chat",
  },
  "mistralai/mixtral-8x7b-instruct-v0.1": {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mixtral 8x7B",
    provider: "Replicate",
    costPerUnit: 0.003,
    unit: "requisição",
    category: "chat",
  },
}

// Custo padrão para modelos desconhecidos
export const DEFAULT_COST: ModelCost = {
  id: "unknown",
  name: "Modelo Desconhecido",
  provider: "Desconhecido",
  costPerUnit: 0.025,
  unit: "chamada",
  category: "image",
}

export function getModelCost(modelId: string): ModelCost {
  return MODEL_COSTS[modelId] || DEFAULT_COST
}

// Taxa de câmbio aproximada USD -> BRL
export const USD_TO_BRL = 5.0

export function convertToBRL(usd: number): number {
  return usd * USD_TO_BRL
}

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
}

export function formatUSD(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  })
}

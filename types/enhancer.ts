export interface EnhancementParams {
  model: "faithful" | "creative"
  scaleFactor: number
  prompt?: string
  aiStrength: number
  resemblance: number
  clarity: number
  sharpness: number
  matchColor: boolean
}

export interface StartEnhancementInput {
  imageUrl: string
  params: EnhancementParams
}

export interface StartEnhancementResponse {
  jobId: string
  status: string
}

import { create } from "zustand"
import { z } from "zod"

// Schema para validação dos parâmetros
export const enhancementParamsSchema = z.object({
  model: z.enum(["faithful", "creative"]).default("faithful"),
  scaleFactor: z.number().min(1).max(4).default(2),
  prompt: z.string().optional(),
  aiStrength: z.number().min(0).max(100).default(50),
  resemblance: z.number().min(0).max(100).default(50),
  clarity: z.number().min(0).max(100).default(50),
  sharpness: z.number().min(0).max(1).default(0.5),
  matchColor: z.boolean().default(true),
})

export type EnhancementParams = z.infer<typeof enhancementParamsSchema>

type JobStatus = "idle" | "processing" | "starting" | "succeeded" | "failed"

interface EnhancerStore {
  inputImageUrl: string | null
  outputImageUrl: string | null
  enhancementParams: EnhancementParams
  jobId: string | null
  jobStatus: JobStatus

  setInputImageUrl: (url: string | null) => void
  setOutputImageUrl: (url: string | null) => void
  setEnhancementParams: (params: Partial<EnhancementParams>) => void
  setJobId: (id: string | null) => void
  setJobStatus: (status: JobStatus) => void
  reset: () => void
}

const initialState = {
  inputImageUrl: null,
  outputImageUrl: null,
  enhancementParams: enhancementParamsSchema.parse({}),
  jobId: null,
  jobStatus: "idle" as JobStatus,
}

export const useEnhancerStore = create<EnhancerStore>((set) => ({
  ...initialState,

  setInputImageUrl: (url) => set({ inputImageUrl: url, outputImageUrl: null, jobId: null, jobStatus: "idle" }),
  setOutputImageUrl: (url) => set({ outputImageUrl: url }),
  setEnhancementParams: (params) =>
    set((state) => ({
      enhancementParams: { ...state.enhancementParams, ...params },
    })),
  setJobId: (id) => set({ jobId: id }),
  setJobStatus: (status) => set({ jobStatus: status }),
  reset: () => set(initialState),
}))

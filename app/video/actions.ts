"use server"

import { createServerClient } from "@/lib/supabase/server"
import { replicate, MODELS } from "@/lib/replicate-service"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"

export interface VideoGenerationResult {
  videoId?: string
  predictionId?: string
  status?: string
  error?: string
  videoUrl?: string | null
}

export async function startVideoGeneration(formData: FormData): Promise<VideoGenerationResult> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "Usuário não autenticado." }
  }

  const prompt = formData.get("prompt") as string
  const lengthSeconds = Number.parseInt(formData.get("length_seconds") as string, 10) || 10
  const fps = Number.parseInt(formData.get("fps") as string, 10) || 24
  const resolution = (formData.get("resolution") as "480p" | "720p" | "1080p") || "720p"
  const seed = formData.get("seed") ? Number.parseInt(formData.get("seed") as string, 10) : undefined

  if (!prompt) {
    return { error: "O prompt é obrigatório." }
  }

  // Deduct credits or check premium status (implement as needed)
  // For now, let's assume this is handled or not required for video.

  let videoRecord: Database["public"]["Tables"]["videos"]["Row"] | null = null

  try {
    // 1. Create initial record in Supabase
    const { data: newVideo, error: insertError } = await supabase
      .from("videos")
      .insert({
        user_id: user.id,
        prompt,
        status: "processing",
        length_seconds: lengthSeconds,
        fps,
        resolution,
        metadata: seed ? { seed } : null,
      })
      .select()
      .single()

    if (insertError || !newVideo) {
      console.error("Error creating video record:", insertError)
      return { error: "Falha ao iniciar a geração do vídeo no banco de dados." }
    }
    videoRecord = newVideo

    // 2. Call Replicate API
    const prediction = await replicate!.predictions.create({
      version: MODELS.videoGeneration.split(":")[1],
      input: {
        prompt,
        length_seconds: lengthSeconds,
        fps,
        resolution,
        ...(seed && { seed }),
      },
      webhook: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/replicate-video`,
      webhook_events_filter: ["start", "output", "logs", "completed"],
    })

    if (!prediction || prediction.status === "failed") {
      await supabase
        .from("videos")
        .update({ status: "failed", error_message: prediction?.error?.detail || "Falha na API Replicate" })
        .eq("id", videoRecord.id)
      return { error: prediction?.error?.detail || "Falha ao iniciar a predição no Replicate." }
    }

    // 3. Update video record with prediction ID
    await supabase
      .from("videos")
      .update({ replicate_prediction_id: prediction.id, status: prediction.status })
      .eq("id", videoRecord.id)

    revalidatePath("/video")
    return { videoId: videoRecord.id, predictionId: prediction.id, status: prediction.status }
  } catch (error: any) {
    console.error("Error in startVideoGeneration:", error)
    if (videoRecord?.id) {
      await supabase
        .from("videos")
        .update({ status: "failed", error_message: error.message || "Erro desconhecido" })
        .eq("id", videoRecord.id)
    }
    return { error: error.message || "Ocorreu um erro inesperado." }
  }
}

export async function getVideoStatus(predictionId: string): Promise<VideoGenerationResult> {
  if (!replicate) {
    return { error: "Replicate client não configurado." }
  }
  try {
    const prediction = await replicate.predictions.get(predictionId)

    if (prediction.status === "succeeded" && prediction.output) {
      const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
      return {
        predictionId: prediction.id,
        status: prediction.status,
        videoUrl: videoUrl as string,
      }
    }

    return { predictionId: prediction.id, status: prediction.status, error: prediction.error?.detail }
  } catch (error: any) {
    console.error("Error fetching video status:", error)
    return { error: error.message || "Falha ao buscar status do vídeo." }
  }
}

export async function getUserVideos(userId: string) {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user videos:", error)
    return []
  }
  return data
}

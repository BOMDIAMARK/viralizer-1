"use server"

import { createServerClient } from "@/lib/supabase/server"
import { startFalCloneTraining } from "@/lib/fal-service"
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"

type Clone = Database["public"]["Tables"]["clones"]["Row"]

// Helper to convert File to base64 data URI
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return `data:${file.type};base64,${buffer.toString("base64")}`
}

export async function createClone(formData: FormData): Promise<{ clone?: Clone; error?: string; falTrainId?: string }> {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) {
    return { error: "Usuário não autenticado." }
  }

  const name = formData.get("name") as string
  const description = formData.get("description") as string
  const userId = session.user.id

  // Fal.ai specific config from FormData
  const triggerWord = formData.get("triggerWord") as string
  const steps = formData.get("steps") ? Number.parseInt(formData.get("steps") as string) : 100
  const batchSize = formData.get("batchSize") ? Number.parseInt(formData.get("batchSize") as string) : 4
  const learningRate = formData.get("learningRate") ? Number.parseFloat(formData.get("learningRate") as string) : 1e-4
  const numEpochs = formData.get("numEpochs") ? Number.parseInt(formData.get("numEpochs") as string) : 3
  const guidanceScale = formData.get("guidanceScale") ? Number.parseFloat(formData.get("guidanceScale") as string) : 7.5
  const seed = formData.get("seed") ? Number.parseInt(formData.get("seed") as string) : 2025

  if (!name.trim()) return { error: "O nome do clone é obrigatório." }
  if (!triggerWord || !triggerWord.trim()) return { error: "A palavra-gatilho é obrigatória." }

  const images: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image-") && value instanceof File) {
      images.push(value)
    }
  }

  if (images.length < 3 || images.length > 10) {
    return { error: "É necessário enviar de 3 a 10 imagens." }
  }

  // Convert images to base64 for Fal.ai
  let imagesBase64: string[]
  try {
    imagesBase64 = await Promise.all(images.map(fileToBase64))
  } catch (e) {
    console.error("Error converting images to base64:", e)
    return { error: "Erro ao processar imagens." }
  }

  // Store original image files in Supabase Storage (optional, but good for reference)
  const trainingImageUrls: string[] = []
  for (let i = 0; i < images.length; i++) {
    const file = images[i]
    const filePath = `${userId}/clones/${name.replace(/\s+/g, "_")}_${Date.now()}/image_${i}.${file.name.split(".").pop()}`
    const { error: uploadError } = await supabase.storage.from("training_images").upload(filePath, file) // Assuming 'training_images' bucket
    if (uploadError) {
      console.error("Error uploading image to Supabase Storage:", uploadError)
      // Continue even if storage fails, Fal.ai uses base64
    } else {
      const { data: publicUrlData } = supabase.storage.from("training_images").getPublicUrl(filePath)
      trainingImageUrls.push(publicUrlData.publicUrl)
    }
  }

  // Create initial clone record in Supabase
  const falConfig = {
    trigger_word: triggerWord,
    steps,
    batch_size: batchSize,
    lr: learningRate,
    num_epochs: numEpochs,
    guidance_scale: guidanceScale,
    seed,
  }

  const { data: newClone, error: dbError } = await supabase
    .from("clones")
    .insert({
      user_id: userId,
      name,
      description,
      status: "training_queued", // Initial status
      training_images: trainingImageUrls.length > 0 ? trainingImageUrls : null,
      trigger_word: triggerWord,
      metadata: { falConfig, progress: 0 },
    })
    .select()
    .single()

  if (dbError || !newClone) {
    console.error("Error creating clone record in DB:", dbError)
    return { error: "Erro ao salvar informações do clone. " + dbError?.message }
  }

  try {
    const falResponse = await startFalCloneTraining(imagesBase64, falConfig)

    if (falResponse.error || !falResponse.id) {
      await supabase
        .from("clones")
        .update({
          status: "training_failed",
          metadata: { ...newClone.metadata, error: falResponse.error || "Fal.ai unknown error" },
        })
        .eq("id", newClone.id)
      return {
        error: `Erro ao iniciar treinamento com Fal.ai: ${JSON.stringify(falResponse.error || "Unknown error")}`,
      }
    }

    // Update clone record with Fal.ai train ID
    const { error: updateError } = await supabase
      .from("clones")
      .update({
        fal_train_id: falResponse.id,
        status: falResponse.status || "training_processing", // Fal.ai might return 'processing'
        metadata: { ...newClone.metadata, progress: falResponse.metrics?.progress || 0 },
      })
      .eq("id", newClone.id)

    if (updateError) {
      console.error("Error updating clone with Fal train ID:", updateError)
      // Training started, but DB update failed. This needs careful handling.
      // For now, return success with a warning or handle reconciliation later.
    }

    revalidatePath("/clones")
    revalidatePath(`/clones/${newClone.id}`)
    return { clone: newClone, falTrainId: falResponse.id }
  } catch (e: any) {
    console.error("Fal.ai training initiation failed:", e)
    await supabase
      .from("clones")
      .update({ status: "training_failed", metadata: { ...newClone.metadata, error: e.message } })
      .eq("id", newClone.id)
    return { error: `Falha ao iniciar treinamento: ${e.message}` }
  }
}

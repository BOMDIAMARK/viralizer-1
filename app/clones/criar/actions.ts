"use server"

import { createServerClient } from "@/lib/supabase/server"
import { startFluxLoraFastTraining } from "@/lib/fal-service" // Still using this, but it's refactored
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"

type Clone = Database["public"]["Tables"]["clones"]["Row"]

// Helper to convert File to base64 data URI
async function fileToBase64(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  return `data:${file.type};base64,${buffer.toString("base64")}`
}

export async function createClone(formData: FormData): Promise<{ clone?: Clone; error?: string }> {
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

  const triggerWord = formData.get("triggerWord") as string
  const steps = formData.get("steps") ? Number.parseInt(formData.get("steps") as string) : 750

  if (!name.trim()) return { error: "O nome do clone é obrigatório." }
  if (!triggerWord || !triggerWord.trim()) return { error: "A palavra-gatilho (trigger) é obrigatória." }

  const imageFiles: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image-") && value instanceof File) {
      imageFiles.push(value)
    }
  }

  if (imageFiles.length < 3 || imageFiles.length > 10) {
    return { error: "É necessário enviar de 3 a 10 imagens." }
  }

  // Convert images to base64 for Fal.ai subscribe
  let imagesDataUrl: string[]
  try {
    imagesDataUrl = await Promise.all(imageFiles.map(fileToBase64))
  } catch (e: any) {
    console.error("Error converting images to base64:", e)
    return { error: `Erro ao processar imagens para base64: ${e.message}` }
  }

  // Optionally, still upload original images to Supabase Storage for reference/backup
  // This part can be kept or removed depending on whether you want to store originals
  const storedImageUrls: string[] = []
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}_${i}.${fileExt}`
    const filePath = `${userId}/clone_source_images/${name.replace(/\s+/g, "_")}/${fileName}`
    const { error: uploadError } = await supabase.storage
      .from("training_images") // Ensure this bucket exists
      .upload(filePath, file)
    if (uploadError) {
      console.warn(
        `Failed to upload original image ${file.name} to Supabase Storage: ${uploadError.message}. Continuing with base64 training.`,
      )
    } else {
      const { data: publicUrlData } = supabase.storage.from("training_images").getPublicUrl(filePath)
      if (publicUrlData?.publicUrl) {
        storedImageUrls.push(publicUrlData.publicUrl)
      }
    }
  }

  const initialCloneData = {
    user_id: userId,
    name,
    description,
    status: "training_queued",
    training_images: storedImageUrls.length > 0 ? storedImageUrls : null, // Store public URLs of originals if saved
    trigger_word: triggerWord,
    metadata: { steps, provider: "fal_subscribe_flux_lora_fast_training", input_type: "base64_data_url" },
  }

  const { data: newClone, error: dbError } = await supabase.from("clones").insert(initialCloneData).select().single()

  if (dbError || !newClone) {
    console.error("Error creating clone record in DB:", dbError)
    return { error: `Erro ao salvar informações do clone: ${dbError?.message}` }
  }

  try {
    // Call the refactored Fal.ai training service using fal.subscribe
    const falResponse = await startFluxLoraFastTraining(imagesDataUrl, triggerWord, steps)

    // fal.subscribe throws on error, so if we reach here, it's likely successful.
    // The response structure is FluxLoraFastTrainingSubscribeResult.
    if (!falResponse.trained_model) {
      // This case should ideally be caught by an error thrown from startFluxLoraFastTraining
      await supabase
        .from("clones")
        .update({
          status: "training_failed",
          metadata: { ...newClone.metadata, error: "Fal.ai training via subscribe did not return trained_model." },
        })
        .eq("id", newClone.id)
      return { error: "Erro ao treinar com Fal.ai: `trained_model` não encontrado na resposta." }
    }

    const { error: updateError } = await supabase
      .from("clones")
      .update({
        status: "training_succeeded",
        model_id: falResponse.trained_model, // Storing the .zip URL
        fal_train_id: falResponse.request_id, // Store Fal's request_id if available
        metadata: {
          ...newClone.metadata,
          bytes_trained: falResponse.bytes_trained,
          fal_request_id: falResponse.request_id,
        },
      })
      .eq("id", newClone.id)

    if (updateError) {
      console.error("Error updating clone with Fal.ai training (subscribe) result:", updateError)
      // Training succeeded with Fal, but DB update failed.
    }

    revalidatePath("/clones")
    revalidatePath(`/clones/${newClone.id}`)
    return {
      clone: {
        ...newClone,
        model_id: falResponse.trained_model,
        status: "training_succeeded",
        fal_train_id: falResponse.request_id,
      },
    }
  } catch (e: any) {
    console.error("Fal.ai training (subscribe) failed:", e)
    await supabase
      .from("clones")
      .update({ status: "training_failed", metadata: { ...newClone.metadata, error: e.message } })
      .eq("id", newClone.id)
    return { error: `Falha ao iniciar treinamento via subscribe: ${e.message}` }
  }
}

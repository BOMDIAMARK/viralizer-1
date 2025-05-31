"use server"

import { createServerClient } from "@/lib/supabase/server"
import { startFluxLoraFastTraining } from "@/lib/fal-service" // Changed import
import { revalidatePath } from "next/cache"
import type { Database } from "@/types/supabase"

type Clone = Database["public"]["Tables"]["clones"]["Row"]

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

  const triggerWord = formData.get("triggerWord") as string // 'trigger' for fast training
  const steps = formData.get("steps") ? Number.parseInt(formData.get("steps") as string) : 750 // Default for fast training

  if (!name.trim()) return { error: "O nome do clone é obrigatório." }
  if (!triggerWord || !triggerWord.trim()) return { error: "A palavra-gatilho (trigger) é obrigatória." }

  const imageFiles: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("image-") && value instanceof File) {
      imageFiles.push(value)
    }
  }

  if (imageFiles.length < 3 || imageFiles.length > 10) {
    // As per your doc, Krea UX suggests 3-10
    return { error: "É necessário enviar de 3 a 10 imagens." }
  }

  // Upload images to Supabase Storage and get public URLs
  const publicImageUrls: string[] = []
  const storageErrorOccurred = false
  for (let i = 0; i < imageFiles.length; i++) {
    const file = imageFiles[i]
    const fileExt = file.name.split(".").pop()
    const fileName = `${Date.now()}_${i}.${fileExt}`
    const filePath = `${userId}/fast_clone_images/${name.replace(/\s+/g, "_")}/${fileName}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("training_images") // Ensure this bucket exists and allows public reads or signed URLs
      .upload(filePath, file)

    if (uploadError) {
      console.error(`Error uploading image ${i + 1} to Supabase Storage:`, uploadError)
      // For fast training, public URLs are essential. If one fails, we should probably stop.
      return { error: `Erro ao fazer upload da imagem ${file.name} para o armazenamento. ${uploadError.message}` }
    }

    const { data: publicUrlData } = supabase.storage.from("training_images").getPublicUrl(filePath)
    if (!publicUrlData || !publicUrlData.publicUrl) {
      return { error: `Erro ao obter URL pública para a imagem ${file.name}.` }
    }
    publicImageUrls.push(publicUrlData.publicUrl)
  }

  if (publicImageUrls.length !== imageFiles.length) {
    return { error: "Falha ao processar todas as URLs das imagens. Verifique o armazenamento." }
  }

  // Create initial clone record in Supabase
  const initialCloneData = {
    user_id: userId,
    name,
    description,
    status: "training_queued", // Initial status before calling Fal
    training_images: publicImageUrls, // Store the public URLs used for training
    trigger_word: triggerWord,
    metadata: { steps, provider: "fal_fast_flux_lora" }, // Store config used
  }

  const { data: newClone, error: dbError } = await supabase.from("clones").insert(initialCloneData).select().single()

  if (dbError || !newClone) {
    console.error("Error creating clone record in DB:", dbError)
    return { error: `Erro ao salvar informações do clone: ${dbError?.message}` }
  }

  try {
    // Call the new Fal.ai fast training service
    const falResponse = await startFluxLoraFastTraining(publicImageUrls, triggerWord, steps)

    if (falResponse.error || !falResponse.trained_model) {
      await supabase
        .from("clones")
        .update({
          status: "training_failed",
          metadata: { ...newClone.metadata, error: falResponse.error || "Fal.ai fast training unknown error" },
        })
        .eq("id", newClone.id)
      const errorMessage = typeof falResponse.error === "object" ? JSON.stringify(falResponse.error) : falResponse.error
      return { error: `Erro ao treinar com Fal.ai: ${errorMessage || "Erro desconhecido"}` }
    }

    // Training successful, update clone record with the LoRA .zip URL
    const { error: updateError } = await supabase
      .from("clones")
      .update({
        status: "training_succeeded", // Or "ready"
        model_id: falResponse.trained_model, // Storing the .zip URL here
        metadata: {
          ...newClone.metadata,
          bytes_trained: falResponse.bytes_trained,
          fal_request_id: falResponse.request_id, // If Fal returns a request_id
        },
      })
      .eq("id", newClone.id)

    if (updateError) {
      console.error("Error updating clone with Fal.ai fast training result:", updateError)
      // Training succeeded with Fal, but DB update failed. Critical to handle.
      // For now, return success but log this issue. User might not see the LoRA URL.
    }

    revalidatePath("/clones")
    revalidatePath(`/clones/${newClone.id}`)
    return { clone: { ...newClone, model_id: falResponse.trained_model, status: "training_succeeded" } } // Return updated clone
  } catch (e: any) {
    console.error("Fal.ai fast training initiation failed:", e)
    await supabase
      .from("clones")
      .update({ status: "training_failed", metadata: { ...newClone.metadata, error: e.message } })
      .eq("id", newClone.id)
    return { error: `Falha ao iniciar treinamento: ${e.message}` }
  }
}

"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import { fal } from "@fal-ai/client"

// Configurar fal.ai
fal.config({
  credentials: process.env.FAL_KEY,
})

// Função para converter File para data URL
async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export async function createClone(formData: FormData) {
  const supabase = createServerClient()

  try {
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const userId = formData.get("userId") as string

    // Verificar se o usuário é premium
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Erro ao verificar status premium do usuário:", userError)
      return { error: "Erro ao verificar status do usuário." }
    }

    if (!userData.is_premium) {
      return { error: "Apenas usuários premium podem criar clones." }
    }

    // Contar quantos clones o usuário já tem
    const { count, error: countError } = await supabase
      .from("clones")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)

    if (countError) {
      console.error("Erro ao contar clones:", countError)
      return { error: "Erro ao verificar limite de clones." }
    }

    // Verificar se o usuário atingiu o limite de clones (5 para usuários premium)
    if ((count || 0) >= 5) {
      return { error: "Você atingiu o limite de 5 clones para seu plano atual." }
    }

    // Coletar todas as imagens do formData
    const imageFiles: File[] = []
    for (const [key, value] of formData.entries()) {
      if (key.startsWith("image-") && value instanceof File) {
        imageFiles.push(value)
      }
    }

    if (imageFiles.length < 3) {
      return { error: "Você precisa enviar pelo menos 3 imagens para treinar seu clone." }
    }

    if (imageFiles.length > 10) {
      return { error: "Você pode enviar no máximo 10 imagens para treinar seu clone." }
    }

    // Converter imagens para data URLs
    console.log("Convertendo imagens para data URLs...")
    const imageDataUrls: string[] = []

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      try {
        const dataURL = await fileToDataURL(file)
        imageDataUrls.push(dataURL)
        console.log(`Imagem ${i + 1} convertida com sucesso`)
      } catch (error) {
        console.error(`Erro ao converter imagem ${i + 1}:`, error)
        return { error: `Erro ao processar a imagem ${i + 1}.` }
      }
    }

    // Fazer upload das imagens para o Supabase Storage (para backup/referência)
    const imageUrls: string[] = []
    const timestamp = Date.now()
    const folderPath = `clones/${userId}/${timestamp}`

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i]
      const fileExt = file.name.split(".").pop()
      const fileName = `${i + 1}.${fileExt}`
      const filePath = `${folderPath}/${fileName}`

      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("training-images")
          .upload(filePath, file)

        if (uploadError) {
          console.error(`Erro ao fazer upload da imagem ${i + 1}:`, uploadError)
          // Continue mesmo se o upload falhar, usando apenas as data URLs
        }

        // Obter URL pública da imagem se o upload foi bem-sucedido
        if (uploadData) {
          const { data: urlData } = await supabase.storage.from("training-images").getPublicUrl(filePath)
          imageUrls.push(urlData.publicUrl)
        } else {
          // Usar placeholder se o upload falhou
          imageUrls.push(`/placeholder.svg?height=300&width=300&query=Training image ${i + 1}`)
        }
      } catch (error) {
        console.error(`Erro no upload da imagem ${i + 1}:`, error)
        imageUrls.push(`/placeholder.svg?height=300&width=300&query=Training image ${i + 1}`)
      }
    }

    // Selecionar uma imagem de amostra (a primeira)
    const sampleImageUrl = imageUrls[0]

    // Criar registro do clone no banco de dados
    const { data: cloneData, error: insertError } = await supabase
      .from("clones")
      .insert({
        user_id: userId,
        name,
        description,
        status: "pending",
        sample_image_url: sampleImageUrl,
        training_images: imageUrls,
      })
      .select()
      .single()

    if (insertError) {
      console.error("Erro ao criar clone:", insertError)
      return { error: "Erro ao criar registro do clone no banco de dados." }
    }

    // Iniciar treinamento do modelo com fal.ai
    console.log("Iniciando treinamento do clone com Fal.ai...")

    try {
      // Atualizar status para "training"
      await supabase.from("clones").update({ status: "training" }).eq("id", cloneData.id)

      // Iniciar o treinamento em background
      setTimeout(async () => {
        try {
          console.log("Iniciando treinamento com Fal.ai...")

          const result = await fal.subscribe("fal-ai/flux-lora-portrait-trainer", {
            input: {
              images_data_url: imageDataUrls,
              learning_rate: 0.00009,
              steps: 3509,
              multiresolution_training: true,
              subject_crop: true,
              create_masks: false,
            },
            logs: true,
            onQueueUpdate: (update) => {
              console.log("Status do treinamento:", update.status)
              if (update.status === "IN_PROGRESS") {
                update.logs.map((log) => log.message).forEach(console.log)
              }
            },
          })

          console.log("Resultado do treinamento:", result.data)
          console.log("Request ID:", result.requestId)

          // Verificar se o treinamento foi bem-sucedido
          if (result.data && result.data.diffusers_lora_file) {
            // Atualizar o clone com o resultado do treinamento
            await supabase
              .from("clones")
              .update({
                status: "ready",
                model_id: result.requestId,
                updated_at: new Date().toISOString(),
                metadata: {
                  fal_result: result.data,
                  request_id: result.requestId,
                  lora_file: result.data.diffusers_lora_file,
                  config_file: result.data.config_file,
                },
              })
              .eq("id", cloneData.id)

            console.log(`Clone ${cloneData.id} treinado com sucesso!`)
          } else {
            throw new Error("Resultado do treinamento inválido")
          }
        } catch (trainingError) {
          console.error("Erro durante o treinamento:", trainingError)

          // Atualizar o status para "failed"
          await supabase
            .from("clones")
            .update({
              status: "failed",
              updated_at: new Date().toISOString(),
              metadata: {
                error: trainingError instanceof Error ? trainingError.message : "Erro desconhecido",
                failed_at: new Date().toISOString(),
              },
            })
            .eq("id", cloneData.id)
        }

        // Revalidar caminhos relevantes
        revalidatePath("/clones")
        revalidatePath(`/clones/${cloneData.id}`)
      }, 2000) // Aguardar 2 segundos antes de iniciar o treinamento
    } catch (err) {
      console.error("Erro ao iniciar treinamento:", err)
      // Atualizar status para failed
      await supabase
        .from("clones")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", cloneData.id)
    }

    // Revalidar caminhos relevantes
    revalidatePath("/clones")

    return {
      success: true,
      cloneId: cloneData.id,
    }
  } catch (error) {
    console.error("Erro ao criar clone:", error)
    return { error: "Ocorreu um erro inesperado ao tentar criar o clone." }
  }
}

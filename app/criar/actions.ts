"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

interface GenerateImageParams {
  prompt: string
  style: string
  userId: string
  cloneId: string | null
  imageSize?: string
  numInferenceSteps?: number
  guidanceScale?: number
  seed?: number
}

// Mapeamento de estilos para prompts otimizados
const stylePrompts = {
  realistic: "photorealistic, high quality, detailed, professional photography, 8k resolution",
  anime: "anime style, manga style, japanese animation, vibrant colors, detailed",
  cartoon: "cartoon style, animated, colorful, disney style, pixar style",
  "oil-painting": "oil painting style, artistic, painted, classical art, brushstrokes",
  "digital-art": "digital art, concept art, artstation, detailed, fantasy art",
  "pixel-art": "pixel art, 8-bit, retro gaming style, pixelated",
  cyberpunk: "cyberpunk style, neon lights, futuristic, sci-fi, dark atmosphere",
  watercolor: "watercolor painting, soft colors, artistic, flowing paint",
  "pencil-sketch": "pencil sketch, hand drawn, artistic, black and white",
  "flat-design": "flat design, minimalist, clean, vector art, simple shapes",
  portrait: "portrait photography, professional headshot, studio lighting",
  landscape: "landscape photography, scenic view, natural lighting, wide angle",
  abstract: "abstract art, modern art, geometric shapes, artistic composition",
  vintage: "vintage style, retro, aged, classic, nostalgic atmosphere",
  minimalist: "minimalist design, clean, simple, white background, modern",
}

// Configurações de qualidade por modelo
const modelConfigs = {
  "flux-pro": {
    steps: 25,
    guidance: 3.5,
    quality: "high",
  },
  "flux-dev": {
    steps: 28,
    guidance: 3.5,
    quality: "medium",
  },
  "flux-schnell": {
    steps: 4,
    guidance: 3.5,
    quality: "fast",
  },
}

export async function generateImage({
  prompt,
  style,
  userId,
  cloneId,
  imageSize = "landscape_4_3",
  numInferenceSteps,
  guidanceScale,
  seed,
}: GenerateImageParams) {
  const supabase = createServerClient()

  try {
    console.log("Iniciando geração de imagem...", { prompt, style, userId, cloneId })

    // Verificar se a chave FAL está configurada
    if (!process.env.FAL_KEY) {
      console.error("FAL_KEY não está configurada")
      return { error: "Serviço de geração de imagens não está configurado." }
    }

    // Verificar créditos do usuário
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("credits, is_premium")
      .eq("id", userId)
      .single()

    if (userError) {
      console.error("Erro ao verificar créditos do usuário:", userError)
      return { error: "Erro ao verificar créditos do usuário." }
    }

    if (userData.credits < 1) {
      return { error: "Créditos insuficientes para gerar uma imagem." }
    }

    // Preparar o prompt e modelo baseado no estilo ou clone
    let finalPrompt = prompt
    let modelToUse = "flux-dev" // Usar Flux Dev como padrão
    let additionalParams = {}

    if (cloneId) {
      // Buscar dados do clone
      const { data: cloneData, error: cloneError } = await supabase
        .from("clones")
        .select("*")
        .eq("id", cloneId)
        .eq("user_id", userId)
        .single()

      if (cloneError || !cloneData) {
        return { error: "Clone não encontrado ou não pertence ao usuário." }
      }

      if (cloneData.status !== "ready") {
        return { error: "O clone ainda não está pronto para uso." }
      }

      // Usar o modelo LoRA treinado do clone
      if (cloneData.metadata?.fal_result?.diffusers_lora_file) {
        modelToUse = "flux-lora"
        additionalParams = {
          lora_path: cloneData.metadata.fal_result.diffusers_lora_file.url,
          lora_scale: 0.8,
        }
        finalPrompt = `${prompt}, in the style of the trained model`
      }
    } else {
      // Aplicar estilos pré-definidos
      const stylePrompt = stylePrompts[style as keyof typeof stylePrompts]
      if (stylePrompt) {
        finalPrompt = `${prompt}, ${stylePrompt}`
      }

      // Usar Flux Pro para usuários premium em estilos específicos
      if (userData.is_premium && ["realistic", "portrait", "digital-art"].includes(style)) {
        modelToUse = "flux-pro"
      }
    }

    // Obter configurações do modelo
    const config = modelConfigs[modelToUse as keyof typeof modelConfigs] || modelConfigs["flux-dev"]

    // Preparar parâmetros de geração
    const generationParams = {
      prompt: finalPrompt,
      image_size: imageSize,
      num_inference_steps: numInferenceSteps || config.steps,
      guidance_scale: guidanceScale || config.guidance,
      num_images: 1,
      enable_safety_checker: true,
      output_format: "jpeg",
      output_quality: 95,
      ...additionalParams,
    }

    // Adicionar seed se fornecido
    if (seed) {
      generationParams.seed = seed
    }

    console.log(`Gerando imagem com ${modelToUse}...`, {
      prompt: finalPrompt,
      style,
      model: modelToUse,
      params: generationParams,
    })

    // Determinar o endpoint correto da API fal.ai
    let apiEndpoint: string
    switch (modelToUse) {
      case "flux-pro":
        apiEndpoint = "https://fal.run/fal-ai/flux-pro"
        break
      case "flux-dev":
        apiEndpoint = "https://fal.run/fal-ai/flux/dev"
        break
      case "flux-schnell":
        apiEndpoint = "https://fal.run/fal-ai/flux/schnell"
        break
      case "flux-lora":
        apiEndpoint = "https://fal.run/fal-ai/flux-lora"
        break
      default:
        apiEndpoint = "https://fal.run/fal-ai/flux/dev"
    }

    console.log("Chamando API fal.ai:", apiEndpoint)

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
        "User-Agent": "Viralizer/1.0",
      },
      body: JSON.stringify(generationParams),
    })

    console.log("Status da resposta:", response.status)
    console.log("Headers da resposta:", Object.fromEntries(response.headers.entries()))

    // Verificar se a resposta foi bem-sucedida
    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorMessage = `Erro HTTP ${response.status}`

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          console.error("Erro JSON da API:", errorData)
          errorMessage = errorData.detail || errorData.message || errorMessage
        } else {
          const errorText = await response.text()
          console.error("Erro de texto da API:", errorText)
          errorMessage = errorText.substring(0, 200) // Limitar o tamanho da mensagem
        }
      } catch (parseError) {
        console.error("Erro ao parsear resposta de erro:", parseError)
      }

      return {
        error: `Erro na API de geração de imagens (${response.status}): ${
          response.status === 401
            ? "Chave de API inválida ou expirada"
            : response.status === 429
              ? "Limite de requisições excedido. Tente novamente em alguns minutos"
              : response.status === 400
                ? "Parâmetros inválidos na requisição"
                : response.status === 500
                  ? "Erro interno do servidor de IA"
                  : errorMessage
        }`,
      }
    }

    // Verificar o tipo de conteúdo da resposta
    const contentType = response.headers.get("content-type")
    if (!contentType || !contentType.includes("application/json")) {
      const responseText = await response.text()
      console.error("Resposta não é JSON:", responseText)
      return { error: "Resposta inválida do servidor de IA. Tente novamente." }
    }

    // Parsear a resposta JSON
    let result
    try {
      result = await response.json()
      console.log("Resultado da geração:", result)
    } catch (jsonError) {
      console.error("Erro ao parsear JSON da resposta:", jsonError)
      return { error: "Erro ao processar resposta do servidor de IA." }
    }

    // Verificar se o resultado contém as imagens
    if (!result || !result.images || !Array.isArray(result.images) || result.images.length === 0) {
      console.error("Resultado inválido da API:", result)
      return { error: "Falha ao gerar a imagem. Tente novamente com um prompt diferente." }
    }

    const generatedImage = result.images[0]
    const imageUrl = generatedImage.url

    if (!imageUrl) {
      console.error("URL da imagem não encontrada no resultado:", generatedImage)
      return { error: "Erro ao obter a URL da imagem gerada." }
    }

    // Gerar um ID único para a imagem
    const imageId = crypto.randomUUID()

    // Ensure seed fits within PostgreSQL integer range (-2,147,483,648 to 2,147,483,647)
    const normalizedSeed = result.seed || seed
    let dbSeed = null
    if (normalizedSeed !== undefined && normalizedSeed !== null) {
      // Convert to 32-bit signed integer range
      dbSeed = normalizedSeed > 2147483647 ? normalizedSeed % 2147483647 : normalizedSeed
      if (dbSeed < -2147483648) {
        dbSeed = Math.abs(dbSeed) % 2147483647
      }
    }

    // Salvar a imagem no banco de dados
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .insert({
        id: imageId,
        user_id: userId,
        prompt,
        style: cloneId ? "clone" : style,
        model: modelToUse,
        image_url: imageUrl,
        width: generatedImage.width || 1024,
        height: generatedImage.height || 768,
        seed: dbSeed,
        is_public: false,
        metadata: {
          clone_id: cloneId,
          original_seed: normalizedSeed, // Store the original seed in metadata
          generation_params: {
            original_prompt: prompt,
            final_prompt: finalPrompt,
            style,
            guidance_scale: generationParams.guidance_scale,
            num_inference_steps: generationParams.num_inference_steps,
            model_used: modelToUse,
            image_size: imageSize,
            fal_request_id: result.request_id,
            generation_time: result.timings?.inference || null,
            ...additionalParams,
          },
          fal_result: {
            request_id: result.request_id,
            timings: result.timings,
            has_nsfw_concepts: result.has_nsfw_concepts || false,
          },
        },
      })
      .select()
      .single()

    if (imageError) {
      console.error("Erro ao salvar imagem:", imageError)
      return { error: "Erro ao salvar a imagem gerada." }
    }

    // Deduzir um crédito do usuário
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: userData.credits - 1 })
      .eq("id", userId)

    if (updateError) {
      console.error("Erro ao deduzir crédito:", updateError)
      // Não retornamos erro aqui, pois a imagem já foi gerada
    }

    // Revalidar caminhos relevantes
    revalidatePath("/dashboard")
    revalidatePath("/criar")
    revalidatePath("/minhas-imagens")

    return {
      success: true,
      imageUrl: imageUrl,
      imageId: imageId,
      seed: normalizedSeed, // Return the original seed, not the normalized one
      model: modelToUse,
      generationTime: result.timings?.inference,
    }
  } catch (error) {
    console.error("Erro detalhado ao gerar imagem:", error)

    // Tratar erros específicos
    if (error instanceof Error) {
      console.error("Mensagem do erro:", error.message)
      console.error("Stack do erro:", error.stack)

      if (error.message.includes("NSFW")) {
        return {
          error:
            "O conteúdo solicitado foi rejeitado por violar nossas diretrizes de segurança. Tente um prompt diferente.",
        }
      }
      if (error.message.includes("fetch")) {
        return { error: "Erro de conexão com o serviço de IA. Verifique sua conexão e tente novamente." }
      }
      if (error.message.includes("timeout")) {
        return { error: "A geração da imagem demorou mais que o esperado. Tente novamente." }
      }

      // Retornar a mensagem de erro específica para debug
      return { error: `Erro na geração: ${error.message}` }
    }

    return { error: "Ocorreu um erro inesperado ao tentar gerar a imagem. Tente novamente." }
  }
}

// Função para regenerar uma imagem com novos parâmetros
export async function regenerateImage({
  imageId,
  userId,
  seed,
  guidanceScale,
  numInferenceSteps,
}: {
  imageId: string
  userId: string
  seed?: number
  guidanceScale?: number
  numInferenceSteps?: number
}) {
  const supabase = createServerClient()

  try {
    // Buscar a imagem original
    const { data: originalImage, error: imageError } = await supabase
      .from("images")
      .select("*")
      .eq("id", imageId)
      .eq("user_id", userId)
      .single()

    if (imageError || !originalImage) {
      return { error: "Imagem não encontrada." }
    }

    // Regenerar com os novos parâmetros
    return await generateImage({
      prompt: originalImage.prompt,
      style: originalImage.style,
      userId,
      cloneId: originalImage.metadata?.clone_id || null,
      seed,
      guidanceScale,
      numInferenceSteps,
    })
  } catch (error) {
    console.error("Erro ao regenerar imagem:", error)
    return { error: "Erro ao regenerar a imagem." }
  }
}

// Função de teste para verificar a conexão com fal.ai
export async function testFalConnection() {
  try {
    console.log("Testando conexão com fal.ai...")

    if (!process.env.FAL_KEY) {
      return { error: "FAL_KEY não está configurada" }
    }

    // Fazer uma chamada simples para testar a conexão
    const response = await fetch("https://fal.run/fal-ai/flux/schnell", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Key ${process.env.FAL_KEY}`,
        "User-Agent": "Viralizer/1.0",
      },
      body: JSON.stringify({
        prompt: "test image, simple",
        image_size: "square",
        num_inference_steps: 4,
      }),
    })

    console.log("Status do teste:", response.status)

    if (!response.ok) {
      const contentType = response.headers.get("content-type")
      let errorMessage = `Erro HTTP ${response.status}`

      try {
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json()
          errorMessage = errorData.detail || errorData.message || errorMessage
        } else {
          const errorText = await response.text()
          errorMessage = errorText.substring(0, 200)
        }
      } catch (parseError) {
        console.error("Erro ao parsear resposta de teste:", parseError)
      }

      return { error: `Erro na API (${response.status}): ${errorMessage}` }
    }

    const result = await response.json()
    console.log("Teste de conexão bem-sucedido:", result.request_id)
    return { success: true, requestId: result.request_id }
  } catch (error) {
    console.error("Erro no teste de conexão:", error)
    return { error: error instanceof Error ? error.message : "Erro desconhecido" }
  }
}

// Função para simular geração de imagem (para testes)
export async function simulateImageGeneration({
  prompt,
  style,
  userId,
}: {
  prompt: string
  style: string
  userId: string
}) {
  const supabase = createServerClient()

  try {
    // Verificar créditos do usuário
    const { data: userData, error: userError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single()

    if (userError) {
      return { error: "Erro ao verificar créditos do usuário." }
    }

    if (userData.credits < 1) {
      return { error: "Créditos insuficientes para gerar uma imagem." }
    }

    // Simular delay de geração
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Gerar um ID único para a imagem
    const imageId = crypto.randomUUID()

    // Usar uma imagem de placeholder
    const imageUrl = `/placeholder.svg?height=1024&width=1024&query=${encodeURIComponent(prompt)}`

    // Salvar a imagem no banco de dados
    const { data: imageData, error: imageError } = await supabase
      .from("images")
      .insert({
        id: imageId,
        user_id: userId,
        prompt,
        style,
        model: "simulation",
        image_url: imageUrl,
        width: 1024,
        height: 1024,
        seed: Math.floor(Math.random() * 1000000),
        is_public: false,
        metadata: {
          simulated: true,
          generation_params: {
            original_prompt: prompt,
            style,
          },
        },
      })
      .select()
      .single()

    if (imageError) {
      console.error("Erro ao salvar imagem simulada:", imageError)
      return { error: "Erro ao salvar a imagem simulada." }
    }

    // Deduzir um crédito do usuário
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: userData.credits - 1 })
      .eq("id", userId)

    if (updateError) {
      console.error("Erro ao deduzir crédito:", updateError)
    }

    // Revalidar caminhos relevantes
    revalidatePath("/dashboard")
    revalidatePath("/criar")
    revalidatePath("/minhas-imagens")

    return {
      success: true,
      imageUrl,
      imageId,
      seed: 12345,
      model: "simulation",
      generationTime: 2.0,
    }
  } catch (error) {
    console.error("Erro ao simular geração:", error)
    return { error: "Erro ao simular geração de imagem." }
  }
}

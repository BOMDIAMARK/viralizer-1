import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { ViralizeError, ERROR_CODES, ErrorHandler, Logger } from "@/lib/error-handler"
import {
  generateImageFromText,
  editImageWithPrompt,
  inpaintImage,
  upscaleImage,
  removeBackground,
  enhanceImage,
  controlNetImage,
  realtimeEdit,
} from "@/lib/replicate-service"

const logger = Logger.getInstance()

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      throw new ViralizeError("Você precisa estar logado para usar o editor", ERROR_CODES.AUTH_REQUIRED, 401)
    }

    // Parse do body com validação
    let body: any
    try {
      body = await request.json()
    } catch (error) {
      throw new ViralizeError("Dados inválidos fornecidos", ERROR_CODES.VALIDATION_ERROR, 400)
    }

    const { action, imageUrl, prompt, maskUrl, settings } = body

    if (!action) {
      throw new ViralizeError("Ação é obrigatória", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
    }

    logger.info("Editor API - Processando ação", {
      action,
      userId: session.user.id,
      hasImage: !!imageUrl,
      hasPrompt: !!prompt,
    })

    let result: string | string[]
    let variations: string[] = []

    // Executar ação baseada no tipo
    switch (action) {
      case "generate":
        if (!prompt?.trim()) {
          throw new ViralizeError("Prompt é obrigatório para gerar imagens", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        result = await generateImageFromText(prompt, { ...settings, numOutputs: 4 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "edit":
        if (!imageUrl?.trim()) {
          throw new ViralizeError("URL da imagem é obrigatória para edição", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        if (!prompt?.trim()) {
          throw new ViralizeError("Prompt é obrigatório para editar imagens", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        result = await editImageWithPrompt(imageUrl, prompt, { ...settings, numOutputs: 3 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "inpaint":
        if (!imageUrl?.trim() || !maskUrl?.trim()) {
          throw new ViralizeError(
            "URLs da imagem e máscara são obrigatórias para inpainting",
            ERROR_CODES.MISSING_REQUIRED_FIELD,
            400,
          )
        }
        if (!prompt?.trim()) {
          throw new ViralizeError("Prompt é obrigatório para inpainting", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        result = await inpaintImage(imageUrl, maskUrl, prompt, { ...settings, numOutputs: 3 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "upscale":
        if (!imageUrl?.trim()) {
          throw new ViralizeError("URL da imagem é obrigatória para upscale", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        result = await upscaleImage(imageUrl, settings?.scale || 2)
        break

      case "removeBackground":
        if (!imageUrl?.trim()) {
          throw new ViralizeError(
            "URL da imagem é obrigatória para remover fundo",
            ERROR_CODES.MISSING_REQUIRED_FIELD,
            400,
          )
        }
        result = await removeBackground(imageUrl)
        break

      case "enhance":
        if (!imageUrl?.trim()) {
          throw new ViralizeError("URL da imagem é obrigatória para melhorar", ERROR_CODES.MISSING_REQUIRED_FIELD, 400)
        }
        result = await enhanceImage(imageUrl)
        break

      case "controlnet":
        if (!imageUrl?.trim() || !prompt?.trim()) {
          throw new ViralizeError(
            "URL da imagem e prompt são obrigatórios para ControlNet",
            ERROR_CODES.MISSING_REQUIRED_FIELD,
            400,
          )
        }
        result = await controlNetImage(imageUrl, prompt)
        break

      case "realtime":
        if (!imageUrl?.trim() || !prompt?.trim()) {
          throw new ViralizeError(
            "URL da imagem e prompt são obrigatórios para edição em tempo real",
            ERROR_CODES.MISSING_REQUIRED_FIELD,
            400,
          )
        }
        result = await realtimeEdit(imageUrl, prompt, settings?.strength || 0.5)
        break

      default:
        throw new ViralizeError(`Ação '${action}' não é suportada`, ERROR_CODES.VALIDATION_ERROR, 400)
    }

    // Registrar a operação no banco de dados
    try {
      const { data: editRecord, error: editError } = await supabase
        .from("edits")
        .insert({
          user_id: session.user.id,
          operation: action,
          prompt: prompt || null,
          input_image: imageUrl,
          output_image: Array.isArray(result) ? result[0] : result,
          settings: settings || {},
        })
        .select()
        .single()

      if (editError) {
        logger.warn("Falha ao salvar edição no banco", {
          error: editError.message,
          userId: session.user.id,
          action,
        })
      }
    } catch (dbError) {
      // Não falhar a operação se o banco falhar
      logger.error(dbError as Error, {
        context: "SAVE_EDIT_RECORD",
        userId: session.user.id,
        action,
      })
    }

    logger.info("Editor API - Sucesso", {
      action,
      userId: session.user.id,
      hasVariations: variations.length > 0,
    })

    return NextResponse.json({
      success: true,
      result,
      variations,
    })
  } catch (error: any) {
    // Processar erro através do handler centralizado
    const processedError = ErrorHandler.handle(error, {
      endpoint: "/api/editor",
      method: "POST",
      userAgent: request.headers.get("user-agent"),
    })

    logger.error(processedError, { context: "EDITOR_API" })

    return NextResponse.json(
      {
        success: false,
        error: processedError.message,
        code: processedError.code,
      },
      { status: processedError.statusCode },
    )
  }
}

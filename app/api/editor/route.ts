import { type NextRequest, NextResponse } from "next/server"
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, prompt, imageUrl, maskUrl } = body

    console.log(`🎨 Editor API - Ação: ${action}`)

    let result: any
    let variations: string[] = []

    switch (action) {
      case "generate":
        result = await generateImageFromText(prompt, { numOutputs: 4 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "edit":
        if (!imageUrl) {
          return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
        }
        result = await editImageWithPrompt(imageUrl, prompt, { numOutputs: 3 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "inpaint":
        if (!imageUrl || !maskUrl) {
          return NextResponse.json({ error: "URL da imagem e máscara são obrigatórias" }, { status: 400 })
        }
        result = await inpaintImage(imageUrl, maskUrl, prompt, { numOutputs: 3 })
        variations = Array.isArray(result) ? result.slice(1) : []
        result = Array.isArray(result) ? result[0] : result
        break

      case "upscale":
        if (!imageUrl) {
          return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
        }
        result = await upscaleImage(imageUrl)
        break

      case "removeBackground":
        if (!imageUrl) {
          return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
        }
        result = await removeBackground(imageUrl)
        break

      case "enhance":
        if (!imageUrl) {
          return NextResponse.json({ error: "URL da imagem é obrigatória" }, { status: 400 })
        }
        result = await enhanceImage(imageUrl)
        break

      case "controlnet":
        if (!imageUrl || !prompt) {
          return NextResponse.json({ error: "URL da imagem e prompt são obrigatórios" }, { status: 400 })
        }
        result = await controlNetImage(imageUrl, prompt)
        break

      case "realtime":
        if (!imageUrl || !prompt) {
          return NextResponse.json({ error: "URL da imagem e prompt são obrigatórios" }, { status: 400 })
        }
        result = await realtimeEdit(imageUrl, prompt)
        break

      default:
        return NextResponse.json({ error: "Ação não suportada" }, { status: 400 })
    }

    console.log("✅ Editor API - Sucesso")

    return NextResponse.json({
      success: true,
      result,
      variations,
    })
  } catch (error: any) {
    console.error("❌ Editor API - Erro:", error)

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import Replicate from "replicate"

// Modelos do Replicate para diferentes operações
const MODELS = {
  textToImage: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  imageToImage: "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60437c13c588468b9810ec23f",
  inpainting: "stability-ai/sdxl-inpainting:c11bbd9ce93c8a39999e4cf9f6c1f6c6d2d21c2156f5022c0e4d8c5b4a7b6129",
  upscale: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
  removeBackground: "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003",
}

// Cliente do Replicate
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { operation, imageUrl, prompt, mask, settings } = await request.json()

    if (!operation || !MODELS[operation as keyof typeof MODELS]) {
      return NextResponse.json({ error: "Operação inválida" }, { status: 400 })
    }

    // Configurar os inputs com base na operação
    let input: Record<string, any> = {}
    const model = MODELS[operation as keyof typeof MODELS]

    switch (operation) {
      case "textToImage":
        input = {
          prompt,
          width: settings?.width || 768,
          height: settings?.height || 768,
          num_outputs: settings?.numOutputs || 1,
        }
        break

      case "imageToImage":
        input = {
          image: imageUrl,
          prompt,
          num_outputs: settings?.numOutputs || 1,
        }
        break

      case "inpainting":
        input = {
          image: imageUrl,
          mask: mask,
          prompt,
          num_outputs: settings?.numOutputs || 1,
        }
        break

      case "upscale":
        input = {
          image: imageUrl,
          scale: settings?.scale || 2,
        }
        break

      case "removeBackground":
        input = {
          image: imageUrl,
        }
        break

      default:
        return NextResponse.json({ error: "Operação não suportada" }, { status: 400 })
    }

    console.log(`Executando operação ${operation} com o modelo ${model}`)

    // Executar a predição no Replicate
    const output = await replicate.run(model, { input })

    // Registrar a operação no banco de dados
    const { data: editRecord, error: editError } = await supabase
      .from("edits")
      .insert({
        user_id: session.user.id,
        operation,
        prompt: prompt || null,
        input_image: imageUrl,
        output_image: Array.isArray(output) ? output[0] : output,
        settings: settings || {},
      })
      .select()
      .single()

    if (editError) {
      console.error("Erro ao salvar edição:", editError)
    }

    return NextResponse.json({
      success: true,
      result: output,
      editId: editRecord?.id,
    })
  } catch (error: any) {
    console.error("Erro na API de edição:", error)
    return NextResponse.json(
      {
        error: error.message || "Erro ao processar a solicitação",
      },
      {
        status: 500,
      },
    )
  }
}

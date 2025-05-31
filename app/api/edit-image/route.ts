import { type NextRequest, NextResponse } from "next/server"
import { editImageWithFlux } from "@/lib/replicate-service"
import { createServerClient } from "@/lib/supabase/server"
import { Ratelimit } from "@upstash/ratelimit"
import { kv } from "@vercel/kv"

const ratelimit =
  process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN
    ? new Ratelimit({
        redis: kv,
        limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 requests per 1 minute
        analytics: true,
      })
    : null

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (ratelimit) {
    const identifier = user.id
    const { success, limit, reset, remaining } = await ratelimit.limit(identifier)

    if (!success) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again later.", limit, reset, remaining },
        { status: 429 },
      )
    }
  }

  try {
    const body = await request.json()
    const { imageBase64, prompt } = body

    if (!imageBase64 || !prompt) {
      return NextResponse.json({ error: "imageBase64 and prompt are required" }, { status: 400 })
    }

    // Validate base64 string
    if (!imageBase64.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid imageBase64 format" }, { status: 400 })
    }

    // Construct webhook URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const webhookUrl = `${siteUrl}/api/webhooks/replicate-image-edit` // New webhook for image edits

    const prediction = await editImageWithFlux(imageBase64, prompt, { webhook: webhookUrl })

    // Optionally, save initial prediction details to your database here if needed
    // For example, associate prediction.id with user.id and the input prompt/image.

    return NextResponse.json({ success: true, predictionId: prediction.id, status: prediction.status })
  } catch (error: any) {
    console.error("❌ Image Edit API - Erro:", error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erro interno do servidor",
      },
      { status: 500 },
    )
  }
}

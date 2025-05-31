import Replicate from "replicate"
import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { ratelimit } from "@/lib/rate-limiter" // Import the ratelimit instance

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
})

export async function POST(req: NextRequest) {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Apply rate limiting using the user's ID
  const identifier = user.id
  const { success, pending, limit, reset, remaining } = await ratelimit.limit(identifier)

  if (!success) {
    return new NextResponse("Too Many Requests", {
      status: 429,
      headers: {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": remaining.toString(),
        "X-RateLimit-Reset": reset.toString(),
        "Retry-After": (reset - Date.now()).toString(), // milliseconds until reset
      },
    })
  }

  const { prompt, model } = await req.json()

  if (!prompt || typeof prompt !== "string") {
    return NextResponse.json({ error: "Prompt is required and must be a string." }, { status: 400 })
  }
  if (!model || typeof model !== "string") {
    return NextResponse.json({ error: "Model is required and must be a string." }, { status: 400 })
  }

  try {
    const output = await replicate.run(model, {
      input: {
        prompt: prompt,
      },
    })

    const imageUrl = Array.isArray(output) && output.length > 0 ? output[0] : output

    return NextResponse.json({ image: imageUrl })
  } catch (error: any) {
    console.error("Error generating image:", error)
    const errorMessage = error.message || "Erro ao gerar imagem"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

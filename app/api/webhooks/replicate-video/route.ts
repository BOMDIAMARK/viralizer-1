import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: NextRequest) {
  try {
    const prediction = await req.json()
    const predictionId = prediction.id

    if (!predictionId) {
      return NextResponse.json({ error: "Prediction ID missing" }, { status: 400 })
    }

    let videoUrl = null
    if (prediction.status === "succeeded" && prediction.output) {
      videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output
    }

    const updateData: any = {
      status: prediction.status,
      updated_at: new Date().toISOString(),
    }

    if (videoUrl) {
      updateData.video_url = videoUrl
      // Potentially generate thumbnail here or set a placeholder
      // updateData.thumbnail_url = ...
    }

    if (prediction.status === "failed" && prediction.error) {
      updateData.error_message =
        typeof prediction.error === "string"
          ? prediction.error
          : JSON.stringify(prediction.error.detail || prediction.error)
    }

    // Update the corresponding video record in Supabase
    const { error: dbError } = await supabaseAdmin
      .from("videos")
      .update(updateData)
      .eq("replicate_prediction_id", predictionId)

    if (dbError) {
      console.error("Supabase update error:", dbError)
      return NextResponse.json({ error: "Failed to update video record", details: dbError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "Webhook received and processed" }, { status: 200 })
  } catch (error: any) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message }, { status: 500 })
  }
}

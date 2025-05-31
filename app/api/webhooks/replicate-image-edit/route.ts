import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key for admin operations
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const prediction = await request.json()
    console.log("Received image edit webhook from Replicate:", JSON.stringify(prediction, null, 2))

    if (!prediction.id) {
      console.error("Webhook payload missing prediction ID")
      return NextResponse.json({ error: "Prediction ID missing" }, { status: 400 })
    }

    // Here, you would typically update your database record for this prediction.
    // For example, if you stored the prediction ID and user ID when the job started:
    // const { data, error } = await supabaseAdmin
    //   .from("edited_images") // Assuming you have an 'edited_images' table
    //   .update({
    //     status: prediction.status,
    //     output_url: prediction.status === "succeeded" ? prediction.output?.[0] : null,
    //     error_message: prediction.status === "failed" ? prediction.error : null,
    //     completed_at: new Date().toISOString(),
    //   })
    //   .eq("replicate_prediction_id", prediction.id)
    //   .select();

    // if (error) {
    //   console.error("Error updating edited image record in Supabase:", error)
    //   return NextResponse.json({ error: "Failed to update database" }, { status: 500 })
    // }
    // console.log("Successfully updated edited image record:", data)

    // For now, we'll just log it. You'll need a table to store these.
    // This webhook is crucial for knowing when the image is ready without constant polling from client.

    return NextResponse.json({ success: true, message: "Webhook received" })
  } catch (error: any) {
    console.error("Error processing Replicate image edit webhook:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}

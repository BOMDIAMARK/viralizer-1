import { type NextRequest, NextResponse } from "next/server"
import { getReplicatePrediction } from "@/lib/replicate-service"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { predictionId: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const predictionId = params.predictionId

  if (!predictionId) {
    return NextResponse.json({ error: "Prediction ID is required" }, { status: 400 })
  }

  try {
    const prediction = await getReplicatePrediction(predictionId)
    // Here you might want to check if the user is authorized to view this prediction's status
    // e.g., by checking if predictionId belongs to user.id from your database.
    return NextResponse.json(prediction)
  } catch (error: any) {
    console.error(`Error fetching status for prediction ${predictionId}:`, error)
    return NextResponse.json({ error: error.message || "Failed to fetch prediction status" }, { status: 500 })
  }
}

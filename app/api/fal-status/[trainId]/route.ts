import { type NextRequest, NextResponse } from "next/server"
import { getFalTrainStatus } from "@/lib/fal-service"
import { createServerClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest, { params }: { params: { trainId: string } }) {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const trainId = params.trainId
  if (!trainId) {
    return NextResponse.json({ error: "Fal.ai Train ID is required" }, { status: 400 })
  }

  try {
    const falStatus = await getFalTrainStatus(trainId)

    // If training succeeded or failed, update Supabase
    if (falStatus.status === "succeeded" || falStatus.status === "failed") {
      const updateData: any = {
        status: `training_${falStatus.status}`, // e.g., training_succeeded
        metadata: { progress: falStatus.metrics?.progress || (falStatus.status === "succeeded" ? 100 : 0) },
      }
      if (falStatus.status === "succeeded" && falStatus.output?.model_id) {
        updateData.model_id = falStatus.output.model_id
      }
      if (falStatus.error) {
        updateData.metadata.error = falStatus.error
      }

      // Find the clone by fal_train_id to update it
      const { error: dbUpdateError } = await supabase
        .from("clones")
        .update(updateData)
        .eq("fal_train_id", trainId)
        .eq("user_id", user.id) // Ensure user owns this clone

      if (dbUpdateError) {
        console.error(`Error updating clone ${trainId} status in DB:`, dbUpdateError)
        // Don't fail the poll, just log the DB error
      }
    }

    return NextResponse.json(falStatus)
  } catch (error: any) {
    console.error(`Error fetching Fal.ai status for ${trainId}:`, error)
    return NextResponse.json({ error: error.message || "Failed to fetch Fal.ai training status" }, { status: 500 })
  }
}

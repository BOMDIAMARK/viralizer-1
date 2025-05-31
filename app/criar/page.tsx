import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ImageGenerationForm from "./components/image-generation-form"

export default async function CreatePage({
  searchParams,
}: {
  searchParams: { prompt?: string; style?: string }
}) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Verificar se o usuário está autenticado
  if (!session) {
    redirect("/login")
  }

  // Buscar dados do usuário
  const { data: userData, error: userError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", session.user.id)
    .single()

  if (userError) {
    console.error("Erro ao buscar dados do usuário:", userError)
  }

  // Buscar clones prontos do usuário
  const { data: userClones, error: clonesError } = await supabase
    .from("clones")
    .select("id, name, model_id")
    .eq("user_id", session.user.id)
    .eq("status", "ready")

  if (clonesError) {
    console.error("Erro ao buscar clones:", clonesError)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
      <ImageGenerationForm
        userId={session.user.id}
        credits={userData?.credits || 0}
        isPremium={userData?.is_premium || false}
        userClones={userClones || []}
        initialPrompt={searchParams.prompt}
        initialStyle={searchParams.style}
      />
    </div>
  )
}

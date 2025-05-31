import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import ClonesList from "./components/clones-list"
import CloneExplainer from "./components/clone-explainer"

export default async function ClonesPage() {
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

  // Buscar clones do usuário
  const { data: userClones, error: clonesError } = await supabase
    .from("clones")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  if (clonesError) {
    console.error("Erro ao buscar clones:", clonesError)
  }

  const isPremium = userData?.is_premium || false

  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Meus Clones</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Treine modelos personalizados com seu estilo único para gerar imagens exclusivas
          </p>
        </div>
        <Button asChild>
          <Link href="/clones/criar">
            <PlusCircle className="w-4 h-4 mr-2" />
            Criar Novo Clone
          </Link>
        </Button>
      </div>

      {!isPremium && <CloneExplainer />}

      <ClonesList clones={userClones || []} isPremium={isPremium} />
    </div>
  )
}

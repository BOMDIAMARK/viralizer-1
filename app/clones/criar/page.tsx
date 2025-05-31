import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import CreateCloneForm from "./components/create-clone-form"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Crown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default async function CreateClonePage() {
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

  const isPremium = userData?.is_premium || false

  // Contar quantos clones o usuário já tem
  const { count: clonesCount, error: countError } = await supabase
    .from("clones")
    .select("*", { count: "exact", head: true })
    .eq("user_id", session.user.id)

  if (countError) {
    console.error("Erro ao contar clones:", countError)
  }

  // Verificar se o usuário pode criar mais clones
  const maxClones = isPremium ? 5 : 0
  const canCreateClone = isPremium && (clonesCount || 0) < maxClones

  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Criar Novo Clone</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Treine um modelo personalizado com seu estilo único para gerar imagens exclusivas
        </p>
      </div>

      {!isPremium ? (
        <Alert className="bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800">
          <Crown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <AlertTitle className="text-violet-800 dark:text-violet-300">Recurso Premium</AlertTitle>
          <AlertDescription className="text-violet-700 dark:text-violet-400">
            <p className="mb-2">
              Clones são modelos de IA personalizados treinados com suas próprias imagens para gerar conteúdo no seu
              estilo único. Este recurso está disponível apenas para usuários premium.
            </p>
            <Button asChild size="sm" className="mt-2">
              <Link href="/precos">Fazer Upgrade</Link>
            </Button>
          </AlertDescription>
        </Alert>
      ) : !canCreateClone ? (
        <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800">
          <AlertTitle className="text-amber-800 dark:text-amber-300">Limite de clones atingido</AlertTitle>
          <AlertDescription className="text-amber-700 dark:text-amber-400">
            <p>
              Você atingiu o limite de {maxClones} clones para seu plano atual. Para criar mais clones, você precisa
              excluir algum clone existente ou fazer upgrade para um plano superior.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <CreateCloneForm userId={session.user.id} />
      )}
    </div>
  )
}

import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Clock, AlertTriangle, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import CloneStatus from "./components/clone-status"
import CloneImages from "./components/clone-images"
import CloneActions from "./components/clone-actions"

export default async function CloneDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Verificar se o usuário está autenticado
  if (!session) {
    redirect("/login")
  }

  // Buscar dados do clone
  const { data: clone, error: cloneError } = await supabase.from("clones").select("*").eq("id", params.id).single()

  if (cloneError) {
    console.error("Erro ao buscar clone:", cloneError)
    notFound()
  }

  // Verificar se o clone pertence ao usuário
  if (clone.user_id !== session.user.id) {
    redirect("/clones")
  }

  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clones">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{clone.name}</h1>
            <div className="flex items-center mt-2 space-x-4">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <Clock className="w-4 h-4 mr-1" />
                Criado{" "}
                {formatDistanceToNow(new Date(clone.created_at), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </div>
              <StatusBadge status={clone.status} />
            </div>
            {clone.description && <p className="mt-4 text-gray-600 dark:text-gray-400">{clone.description}</p>}
          </div>

          <CloneStatus status={clone.status} metadata={clone.metadata} />
          <CloneImages images={clone.training_images || []} />
        </div>

        <div>
          <CloneActions clone={clone} />
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
          Pendente
        </span>
      )
    case "training":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
          Treinando
        </span>
      )
    case "ready":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Pronto
        </span>
      )
    case "failed":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Falhou
        </span>
      )
    default:
      return null
  }
}

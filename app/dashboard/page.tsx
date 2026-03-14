import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import DashboardStats from "./components/dashboard-stats"
import RecentImages from "./components/recent-images"
import CostMapSevenDays from "./components/cost-map-seven-days"

export default async function DashboardPage() {
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

  // Buscar imagens recentes do usuário
  const { data: recentImages, error: imagesError } = await supabase
    .from("images")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(6)

  if (imagesError) {
    console.error("Erro ao buscar imagens recentes:", imagesError)
  }

  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Bem-vindo de volta, {userData?.full_name || "Creator"}!</p>
        </div>
        <div className="flex gap-4">
          <Button asChild>
            <Link href="/criar">Criar Nova Imagem</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/clones">Meus Clones</Link>
          </Button>
        </div>
      </div>

      <DashboardStats
        credits={userData?.credits || 0}
        subscription={userData?.is_premium ? "premium" : "free"}
        imagesCount={recentImages?.length || 0}
      />

      <CostMapSevenDays />

      <RecentImages images={recentImages || []} />

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Tutoriais Rápidos</h2>
          <ul className="mt-4 space-y-2">
            <li className="text-violet-600 dark:text-violet-400 hover:underline">
              <Link href="/tutoriais/primeiros-passos">Como criar sua primeira imagem</Link>
            </li>
            <li className="text-violet-600 dark:text-violet-400 hover:underline">
              <Link href="/tutoriais/prompts">Escrevendo prompts eficientes</Link>
            </li>
            <li className="text-violet-600 dark:text-violet-400 hover:underline">
              <Link href="/tutoriais/clones">Criando seu primeiro clone</Link>
            </li>
          </ul>
        </div>

        <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Novidades</h2>
          <ul className="mt-4 space-y-4">
            <li>
              <p className="text-sm text-gray-500 dark:text-gray-500">12 de maio, 2023</p>
              <p className="text-gray-900 dark:text-gray-200">
                Novos estilos adicionados: Anime, Pixel Art e Cyberpunk
              </p>
            </li>
            <li>
              <p className="text-sm text-gray-500 dark:text-gray-500">5 de maio, 2023</p>
              <p className="text-gray-900 dark:text-gray-200">Melhorias no sistema de geração de thumbnails</p>
            </li>
            <li>
              <p className="text-sm text-gray-500 dark:text-gray-500">28 de abril, 2023</p>
              <p className="text-gray-900 dark:text-gray-200">Lançamento da plataforma Viralizer!</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ImageGallery from "./components/image-gallery"
import ImageFilters from "./components/image-filters"

export default async function MyImagesPage({
  searchParams,
}: {
  searchParams: { style?: string; sort?: string; search?: string }
}) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Verificar se o usuário está autenticado
  if (!session) {
    redirect("/login")
  }

  // Construir query baseada nos filtros
  let query = supabase
    .from("images")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })

  // Aplicar filtros
  if (searchParams.style && searchParams.style !== "all") {
    query = query.eq("style", searchParams.style)
  }

  if (searchParams.search) {
    query = query.ilike("prompt", `%${searchParams.search}%`)
  }

  // Aplicar ordenação
  if (searchParams.sort === "oldest") {
    query = query.order("created_at", { ascending: true })
  } else if (searchParams.sort === "prompt") {
    query = query.order("prompt", { ascending: true })
  }

  const { data: images, error } = await query

  if (error) {
    console.error("Erro ao buscar imagens:", error)
  }

  // Buscar estilos únicos para filtros
  const { data: stylesData } = await supabase.from("images").select("style").eq("user_id", session.user.id)

  const uniqueStyles = [...new Set(stylesData?.map((item) => item.style) || [])]

  return (
    <div className="container p-4 mx-auto space-y-6 sm:p-6 lg:p-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Minhas Imagens</h1>
        <p className="text-gray-600 dark:text-gray-400">Gerencie e organize todas as suas criações em um só lugar</p>
      </div>

      <ImageFilters availableStyles={uniqueStyles} />
      <ImageGallery images={images || []} />
    </div>
  )
}

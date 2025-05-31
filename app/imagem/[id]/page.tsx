import { createServerClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Download, Share2 } from "lucide-react"
import ImageActions from "./components/image-actions"
import ImageMetadata from "./components/image-metadata"
import RelatedImages from "./components/related-images"

export default async function ImageDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Verificar se o usuário está autenticado
  if (!session) {
    redirect("/login")
  }

  // Buscar dados da imagem
  const { data: image, error: imageError } = await supabase.from("images").select("*").eq("id", params.id).single()

  if (imageError) {
    console.error("Erro ao buscar imagem:", imageError)
    notFound()
  }

  // Verificar se a imagem pertence ao usuário ou é pública
  if (image.user_id !== session.user.id && !image.is_public) {
    redirect("/minhas-imagens")
  }

  // Buscar imagens relacionadas (mesmo estilo)
  const { data: relatedImages } = await supabase
    .from("images")
    .select("*")
    .eq("user_id", session.user.id)
    .eq("style", image.style)
    .neq("id", image.id)
    .limit(6)

  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/minhas-imagens">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para galeria
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Imagem principal */}
        <div className="lg:col-span-2">
          <div className="overflow-hidden bg-white rounded-lg shadow-md dark:bg-gray-800">
            <div className="relative">
              <img src={image.image_url || "/placeholder.svg"} alt={image.prompt} className="w-full h-auto" />
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button size="sm" variant="secondary">
                  <Download className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="secondary">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{image.prompt}</h1>
              <ImageMetadata image={image} />
            </div>
          </div>
        </div>

        {/* Sidebar com ações */}
        <div>
          <ImageActions image={image} isOwner={image.user_id === session.user.id} />
        </div>
      </div>

      {/* Imagens relacionadas */}
      {relatedImages && relatedImages.length > 0 && <RelatedImages images={relatedImages} currentStyle={image.style} />}
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Image {
  id: string
  prompt: string
  style: string
  image_url: string
  created_at: string
  thumbnail_url: string | null
}

interface RecentImagesProps {
  images: Image[]
}

export default function RecentImages({ images }: RecentImagesProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Imagens Recentes</h2>
        <Button asChild variant="ghost" size="sm">
          <Link href="/minhas-imagens">Ver todas</Link>
        </Button>
      </div>

      {images.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
          <p className="text-gray-600 dark:text-gray-400">
            Você ainda não criou nenhuma imagem.
            <Link href="/criar" className="ml-1 text-violet-600 dark:text-violet-400 hover:underline">
              Criar minha primeira imagem
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {images.map((image) => (
            <Link key={image.id} href={`/imagem/${image.id}`}>
              <div className="overflow-hidden transition-all duration-200 bg-white rounded-lg shadow-md hover:shadow-lg dark:bg-gray-800">
                <div className="relative aspect-[4/3]">
                  <img
                    src={image.image_url || "/placeholder.svg"}
                    alt={image.prompt}
                    className="object-cover w-full h-full"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-2 text-sm bg-gradient-to-t from-black/80 to-transparent text-white">
                    {image.prompt.length > 40 ? `${image.prompt.substring(0, 40)}...` : image.prompt}
                  </div>
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 text-xs text-violet-800 bg-violet-100 rounded-full dark:text-violet-300 dark:bg-violet-900/30">
                      {image.style}
                    </span>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(image.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

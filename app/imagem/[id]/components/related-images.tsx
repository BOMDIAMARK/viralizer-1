import Link from "next/link"
import { Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Image {
  id: string
  prompt: string
  image_url: string
  created_at: string
}

interface RelatedImagesProps {
  images: Image[]
  currentStyle: string
}

export default function RelatedImages({ images, currentStyle }: RelatedImagesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Outras imagens no estilo {currentStyle}</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
        {images.map((image) => (
          <Link key={image.id} href={`/imagem/${image.id}`}>
            <div className="overflow-hidden transition-all duration-200 bg-white rounded-lg shadow-md hover:shadow-lg dark:bg-gray-800">
              <div className="relative aspect-square">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.prompt}
                  className="object-cover w-full h-full"
                />
                <div className="absolute bottom-0 left-0 right-0 p-2 text-xs bg-gradient-to-t from-black/80 to-transparent text-white">
                  {image.prompt.length > 30 ? `${image.prompt.substring(0, 30)}...` : image.prompt}
                </div>
              </div>
              <div className="p-2">
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(image.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

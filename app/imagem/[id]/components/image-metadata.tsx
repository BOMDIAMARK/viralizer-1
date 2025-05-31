import { Badge } from "@/components/ui/badge"
import { Clock, ImageIcon, Palette, Settings } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Image {
  id: string
  prompt: string
  style: string
  model: string | null
  width: number | null
  height: number | null
  seed: number | null
  created_at: string
  metadata: any
}

interface ImageMetadataProps {
  image: Image
}

export function ImageMetadata({ image }: ImageMetadataProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Criada {formatDistanceToNow(new Date(image.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>

        {image.width && image.height && (
          <div className="flex items-center space-x-2">
            <ImageIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {image.width} × {image.height} pixels
            </span>
          </div>
        )}

        <div className="flex items-center space-x-2">
          <Palette className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <Badge variant="outline">{image.style}</Badge>
        </div>

        {image.model && (
          <div className="flex items-center space-x-2">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">{image.model}</span>
          </div>
        )}
      </div>

      {image.seed && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Seed:</span>
            <span className="text-sm text-gray-600 dark:text-gray-400 font-mono">{image.seed}</span>
          </div>
        </div>
      )}

      {image.metadata && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Parâmetros de Geração:</h4>
          <div className="space-y-1">
            {image.metadata.generation_params && (
              <>
                {image.metadata.generation_params.guidance_scale && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Guidance Scale:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {image.metadata.generation_params.guidance_scale}
                    </span>
                  </div>
                )}
                {image.metadata.generation_params.num_inference_steps && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Steps:</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {image.metadata.generation_params.num_inference_steps}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

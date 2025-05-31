"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Download, Share2, Eye, MoreHorizontal } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"

interface Image {
  id: string
  prompt: string
  style: string
  image_url: string
  created_at: string
  thumbnail_url: string | null
  width: number | null
  height: number | null
}

interface ImageGalleryProps {
  images: Image[]
}

export default function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const handleDownload = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download iniciado",
        description: "A imagem está sendo baixada.",
      })
    } catch (error) {
      console.error("Erro ao baixar imagem:", error)
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async (image: Image) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Imagem criada no Viralizer",
          text: image.prompt,
          url: image.image_url,
        })
      } catch (error) {
        console.error("Erro ao compartilhar:", error)
      }
    } else {
      // Fallback para navegadores que não suportam Web Share API
      await navigator.clipboard.writeText(image.image_url)
      toast({
        title: "Link copiado",
        description: "O link da imagem foi copiado para a área de transferência.",
      })
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="w-16 h-16 mb-4 text-gray-400 dark:text-gray-600">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-lg font-medium text-gray-900 dark:text-white">Nenhuma imagem encontrada</h3>
        <p className="mb-4 text-gray-600 dark:text-gray-400">
          Você ainda não criou nenhuma imagem ou nenhuma imagem corresponde aos filtros aplicados.
        </p>
        <Button asChild>
          <Link href="/criar">Criar Primeira Imagem</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {images.length} {images.length === 1 ? "imagem encontrada" : "imagens encontradas"}
        </p>
        {selectedImages.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">{selectedImages.length} selecionada(s)</span>
            <Button variant="outline" size="sm">
              Download em lote
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {images.map((image) => (
          <div
            key={image.id}
            className="overflow-hidden transition-all duration-200 bg-white rounded-lg shadow-md hover:shadow-lg dark:bg-gray-800"
          >
            <div className="relative group">
              <div className="relative aspect-[4/3]">
                <img
                  src={image.image_url || "/placeholder.svg"}
                  alt={image.prompt}
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />

                {/* Overlay com ações */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex space-x-2">
                    <Button size="sm" variant="secondary" asChild>
                      <Link href={`/imagem/${image.id}`}>
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleDownload(image.image_url, `viralizer-${image.id}.png`)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleShare(image)}>
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Badge do estilo */}
                <div className="absolute top-2 left-2">
                  <Badge variant="secondary" className="text-xs">
                    {image.style}
                  </Badge>
                </div>

                {/* Menu de opções */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="sm" variant="secondary" className="w-8 h-8 p-0">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/imagem/${image.id}`}>Ver detalhes</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload(image.image_url, `viralizer-${image.id}.png`)}>
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleShare(image)}>Compartilhar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>

            <div className="p-4">
              <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
                {image.prompt.length > 60 ? `${image.prompt.substring(0, 60)}...` : image.prompt}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  {formatDistanceToNow(new Date(image.created_at), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </div>
                {image.width && image.height && (
                  <span>
                    {image.width}×{image.height}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

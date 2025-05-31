"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Image from "next/image"

interface ImageSidebarProps {
  onSelectImage: (imageUrl: string) => void
}

export const ImageSidebar = ({ onSelectImage }: ImageSidebarProps) => {
  const [images, setImages] = useState<string[]>([
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
    "/placeholder.svg?height=300&width=400",
  ])

  // Simular carregamento de imagens do usuário
  useEffect(() => {
    // Aqui você carregaria as imagens do usuário do banco de dados
    // Por enquanto, usamos placeholders
  }, [])

  const handleUpload = () => {
    // Simular upload de imagem
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string
          setImages((prev) => [imageUrl, ...prev])
          onSelectImage(imageUrl)
        }
        reader.readAsDataURL(file)
      }
    }
    input.click()
  }

  return (
    <div className="w-16 bg-gray-900 border-r border-gray-800 flex flex-col items-center py-2 overflow-y-auto">
      <Button variant="ghost" size="icon" onClick={handleUpload} className="mb-4 hover:bg-gray-800">
        <Plus className="h-5 w-5" />
      </Button>

      <div className="flex flex-col gap-2 items-center">
        {images.map((image, index) => (
          <button
            key={index}
            className="w-12 h-12 rounded-md overflow-hidden border border-gray-700 hover:border-coral-500 transition-colors"
            onClick={() => onSelectImage(image)}
          >
            <Image
              src={image || "/placeholder.svg"}
              alt={`Imagem ${index + 1}`}
              width={48}
              height={48}
              className="object-cover w-full h-full"
            />
          </button>
        ))}
      </div>
    </div>
  )
}

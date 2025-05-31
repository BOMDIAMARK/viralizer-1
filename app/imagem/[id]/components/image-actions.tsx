"use client"

import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { Copy, Download, MoreHorizontal, Trash, Sparkles } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { generateImage, deleteImage } from "@/app/criar/actions" // Import generateImage

interface ImageActionsProps {
  imageId: string
  imageUrl: string
  prompt: string
  style: string
  negativePrompt?: string
  userId: string
  credits: number
  isPremium: boolean
  modelId: string
}

export function ImageActions({
  imageId,
  imageUrl,
  prompt,
  style,
  negativePrompt,
  userId,
  credits,
  isPremium,
  modelId,
}: ImageActionsProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isGeneratingVariation, setIsGeneratingVariation] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja deletar esta imagem?")) {
      return
    }
    setIsDeleting(true)
    const result = await deleteImage(imageId)
    if (result.error) {
      toast({
        title: "Erro ao deletar imagem",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Imagem deletada!",
        description: "A imagem foi removida com sucesso.",
      })
      router.push("/minhas-imagens") // Redirect to gallery after deletion
      router.refresh()
    }
    setIsDeleting(false)
  }

  const handleDownload = () => {
    const link = document.createElement("a")
    link.href = imageUrl
    link.download = `viralizer-image-${imageId}.jpeg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({
      title: "Download iniciado",
      description: "Sua imagem está sendo baixada.",
    })
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(imageUrl)
    toast({
      title: "Link copiado",
      description: "O link da imagem foi copiado para a área de transferência.",
    })
  }

  const handleGenerateVariation = async () => {
    if (credits < 1) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não tem créditos suficientes para gerar uma variação.",
        variant: "destructive",
      })
      return
    }

    setIsGeneratingVariation(true)
    toast({
      title: "Gerando variação...",
      description: "Isso pode levar alguns segundos.",
    })

    try {
      const result = await generateImage({
        prompt,
        negativePrompt,
        style,
        userId,
        cloneId: null, // Variations typically don't use clones directly, or you'd need to pass the original cloneId
        imageSize: "square_hd", // You might want to make this configurable or derive from original image
        guidanceScale: 3.5, // Default values, consider making these configurable
        numInferenceSteps: 28, // Default values, consider making these configurable
        seed: undefined, // Generate a new random seed for variation
        modelId: modelId, // Use the same model as the original image
        inputImageUrl: imageUrl, // Pass the current image as input for variation
      })

      if (result.error) {
        toast({
          title: "Erro ao gerar variação",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Variação gerada com sucesso!",
          description: "Redirecionando para a nova imagem...",
        })
        router.push(`/imagem/${result.imageId}`)
        router.refresh()
      }
    } catch (error) {
      console.error("Error generating variation:", error)
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar gerar a variação.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingVariation(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button onClick={handleGenerateVariation} disabled={isGeneratingVariation || credits < 1}>
        {isGeneratingVariation ? (
          <div className="flex items-center">
            <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
            Gerando...
          </div>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Gerar Variações
          </>
        )}
      </Button>
      <Button variant="outline" onClick={handleDownload}>
        <Download className="w-4 h-4 mr-2" />
        Download
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="w-4 h-4" />
            <span className="sr-only">Mais opções</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleCopyLink}>
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
            <Trash className="w-4 h-4 mr-2" />
            {isDeleting ? "Deletando..." : "Deletar"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

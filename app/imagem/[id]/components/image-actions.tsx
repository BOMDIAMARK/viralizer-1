"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Download, Share2, Edit, Trash2, Copy, Eye, EyeOff } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Image {
  id: string
  prompt: string
  style: string
  image_url: string
  is_public: boolean
  created_at: string
}

interface ImageActionsProps {
  image: Image
  isOwner: boolean
}

export default function ImageActions({ image, isOwner }: ImageActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const router = useRouter()

  const handleDownload = async () => {
    try {
      const response = await fetch(image.image_url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `viralizer-${image.id}.png`
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

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Imagem criada no Viralizer",
          text: image.prompt,
          url: window.location.href,
        })
      } catch (error) {
        console.error("Erro ao compartilhar:", error)
      }
    } else {
      await navigator.clipboard.writeText(window.location.href)
      toast({
        title: "Link copiado",
        description: "O link da imagem foi copiado para a área de transferência.",
      })
    }
  }

  const handleCopyPrompt = async () => {
    await navigator.clipboard.writeText(image.prompt)
    toast({
      title: "Prompt copiado",
      description: "O prompt foi copiado para a área de transferência.",
    })
  }

  const handleToggleVisibility = async () => {
    setIsToggling(true)
    try {
      // Aqui você implementaria a lógica para alterar a visibilidade
      toast({
        title: "Visibilidade alterada",
        description: `A imagem agora está ${image.is_public ? "privada" : "pública"}.`,
      })
      router.refresh()
    } catch (error) {
      console.error("Erro ao alterar visibilidade:", error)
      toast({
        title: "Erro",
        description: "Não foi possível alterar a visibilidade da imagem.",
        variant: "destructive",
      })
    } finally {
      setIsToggling(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Aqui você implementaria a lógica para excluir a imagem
      toast({
        title: "Imagem excluída",
        description: "A imagem foi excluída com sucesso.",
      })
      router.push("/minhas-imagens")
    } catch (error) {
      console.error("Erro ao excluir imagem:", error)
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir a imagem.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Ações</span>
            <Badge variant={image.is_public ? "default" : "secondary"}>{image.is_public ? "Pública" : "Privada"}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={handleDownload} className="w-full justify-start">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>

          <Button onClick={handleShare} variant="outline" className="w-full justify-start">
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>

          <Button onClick={handleCopyPrompt} variant="outline" className="w-full justify-start">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Prompt
          </Button>

          {isOwner && (
            <>
              <Button
                onClick={handleToggleVisibility}
                variant="outline"
                className="w-full justify-start"
                disabled={isToggling}
              >
                {image.is_public ? (
                  <>
                    <EyeOff className="w-4 h-4 mr-2" />
                    Tornar Privada
                  </>
                ) : (
                  <>
                    <Eye className="w-4 h-4 mr-2" />
                    Tornar Pública
                  </>
                )}
              </Button>

              <Button asChild variant="outline" className="w-full justify-start">
                <Link href={`/criar?prompt=${encodeURIComponent(image.prompt)}&style=${image.style}`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Recriar Similar
                </Link>
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full justify-start">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Imagem
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação não pode ser desfeita. Isso excluirá permanentemente a imagem e todos os seus dados
                      associados.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
                      {isDeleting ? "Excluindo..." : "Excluir"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Criar Similar</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Use este prompt e estilo como base para criar uma nova imagem.
          </p>
          <Button asChild className="w-full">
            <Link href={`/criar?prompt=${encodeURIComponent(image.prompt)}&style=${image.style}`}>
              Criar Nova Imagem
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

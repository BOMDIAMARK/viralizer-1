"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Pencil, Trash2, Sparkles } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import Link from "next/link"

interface Clone {
  id: string
  name: string
  description: string | null
  status: string
  model_id: string | null
}

interface CloneActionsProps {
  clone: Clone
}

export default function CloneActions({ clone }: CloneActionsProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(clone.name)
  const [description, setDescription] = useState(clone.description || "")
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    // Aqui você implementaria a lógica para salvar as alterações
    toast({
      title: "Clone atualizado",
      description: "As informações do clone foram atualizadas com sucesso.",
    })
    setIsEditing(false)
    router.refresh()
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      // Aqui você implementaria a lógica para excluir o clone
      toast({
        title: "Clone excluído",
        description: "O clone foi excluído com sucesso.",
      })
      router.push("/clones")
      router.refresh()
    } catch (error) {
      console.error("Erro ao excluir clone:", error)
      toast({
        title: "Erro ao excluir",
        description: "Ocorreu um erro ao tentar excluir o clone.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditing ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Clone</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={handleSave}>Salvar</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsEditing(true)}
              disabled={clone.status === "pending" || clone.status === "training"}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar Informações
            </Button>

            <Button variant="outline" className="w-full justify-start" asChild disabled={clone.status !== "ready"}>
              <Link href="/criar">
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar Imagem com Este Clone
              </Link>
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full justify-start">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Clone
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. Isso excluirá permanentemente o clone "{clone.name}" e todos os
                    seus dados associados.
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
  )
}

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Upload, X, ImageIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClone } from "../actions"

interface CreateCloneFormProps {
  userId: string
}

export default function CreateCloneForm({ userId }: CreateCloneFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)

      // Verificar se o usuário está tentando adicionar mais de 10 imagens
      if (images.length + selectedFiles.length > 10) {
        toast({
          title: "Limite de imagens excedido",
          description: "Você pode enviar no máximo 10 imagens para treinar seu clone.",
          variant: "destructive",
        })
        return
      }

      // Verificar o tamanho de cada arquivo (máximo 5MB)
      const validFiles = selectedFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} excede o limite de 5MB.`,
            variant: "destructive",
          })
          return false
        }
        return true
      })

      // Adicionar apenas arquivos válidos
      setImages((prev) => [...prev, ...validFiles])

      // Criar URLs de prévia para as imagens
      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    // Revogar URL de prévia para evitar vazamento de memória
    URL.revokeObjectURL(previewUrls[index])

    // Remover imagem e prévia dos arrays
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Validar formulário
      if (!name.trim()) {
        setError("O nome do clone é obrigatório.")
        return
      }

      if (images.length < 3) {
        setError("Você precisa enviar pelo menos 3 imagens para treinar seu clone.")
        return
      }

      // Criar FormData para enviar as imagens
      const formData = new FormData()
      formData.append("name", name)
      formData.append("description", description)
      formData.append("userId", userId)

      // Adicionar cada imagem ao FormData
      images.forEach((image, index) => {
        formData.append(`image-${index}`, image)
      })

      // Enviar para o servidor
      const result = await createClone(formData)

      if (result.error) {
        setError(result.error)
        toast({
          title: "Erro ao criar clone",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Clone criado com sucesso!",
        description: "Seu clone está sendo treinado e ficará disponível em breve.",
      })

      // Redirecionar para a página de clones
      router.push("/clones")
      router.refresh()
    } catch (err) {
      console.error("Erro ao criar clone:", err)
      setError("Ocorreu um erro inesperado ao tentar criar o clone.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="flex items-center p-3 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Clone</Label>
            <Input
              id="name"
              placeholder="Ex: Meu Estilo Artístico"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Escolha um nome descritivo para identificar seu clone
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o estilo do seu clone..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images">Imagens de Referência</Label>
            <div className="p-4 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-3 rounded-full bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Arraste e solte imagens aqui ou clique para selecionar
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Envie de 3 a 10 imagens no formato JPG ou PNG (máx. 5MB cada)
                  </p>
                </div>
                <Input
                  id="images"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("images")?.click()}
                  disabled={isLoading}
                >
                  Selecionar Imagens
                </Button>
              </div>
            </div>
          </div>

          {previewUrls.length > 0 && (
            <div className="space-y-2">
              <Label>Imagens Selecionadas ({previewUrls.length}/10)</Label>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative group">
                    <div className="overflow-hidden rounded-md aspect-square bg-gray-100 dark:bg-gray-800">
                      <img
                        src={url || "/placeholder.svg"}
                        alt={`Imagem ${index + 1}`}
                        className="object-cover w-full h-full"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {previewUrls.length < 10 && (
                  <button
                    type="button"
                    onClick={() => document.getElementById("images")?.click()}
                    className="flex flex-col items-center justify-center border-2 border-dashed rounded-md border-gray-300 dark:border-gray-700 aspect-square hover:border-violet-400 dark:hover:border-violet-600 transition-colors"
                  >
                    <ImageIcon className="w-8 h-8 text-gray-400 dark:text-gray-600" />
                    <span className="mt-2 text-xs text-gray-500 dark:text-gray-400">Adicionar mais</span>
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Criando Clone...
                </div>
              ) : (
                "Criar Clone"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-blue-500 dark:text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Dicas para melhores resultados</h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="space-y-1 list-disc list-inside">
                <li>Use imagens com estilo consistente para melhores resultados</li>
                <li>Inclua imagens com diferentes ângulos e composições</li>
                <li>Evite imagens com rostos humanos reconhecíveis</li>
                <li>Quanto mais imagens enviar, melhor será o resultado (mínimo 3, máximo 10)</li>
                <li>O treinamento pode levar até 30 minutos para ser concluído</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </form>
  )
}

"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, Upload, X, ImageIcon, Info, Loader2, CheckCircle } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClone } from "../actions"
import { ImageQualityIndicators } from "./image-quality-indicators" // Assuming this is still useful
import { Slider } from "@/components/ui/slider"

interface CreateCloneFormProps {
  userId: string
}

export default function CreateCloneForm({ userId }: CreateCloneFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [triggerWord, setTriggerWord] = useState("")
  const [steps, setSteps] = useState(750) // Default steps for fast training

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [imageQualityMet, setImageQualityMet] = useState(false)

  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      if (images.length + selectedFiles.length > 10) {
        toast({
          title: "Limite de imagens excedido",
          description: "Você pode enviar no máximo 10 imagens.",
          variant: "destructive",
        })
        return
      }
      const validFiles = selectedFiles.filter((file) => {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `O arquivo ${file.name} excede o limite de 5MB.`,
            variant: "destructive",
          })
          return false
        }
        if (!["image/jpeg", "image/png"].includes(file.type)) {
          toast({
            title: "Formato inválido",
            description: `O arquivo ${file.name} não é JPG ou PNG.`,
            variant: "destructive",
          })
          return false
        }
        return true
      })
      setImages((prev) => [...prev, ...validFiles])
      const newPreviewUrls = validFiles.map((file) => URL.createObjectURL(file))
      setPreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewUrls[index])
    setImages((prev) => prev.filter((_, i) => i !== index))
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("O nome do clone é obrigatório.")
      return
    }
    if (!triggerWord.trim()) {
      setError("A palavra-gatilho (trigger) é obrigatória.")
      return
    }
    if (images.length < 3) {
      setError("Você precisa enviar pelo menos 3 imagens.")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccessMessage(null)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("userId", userId)
    images.forEach((image, index) => formData.append(`image-${index}`, image))
    formData.append("triggerWord", triggerWord)
    formData.append("steps", steps.toString())

    try {
      const result = await createClone(formData)
      if (result.error || !result.clone) {
        setError(result.error || "Falha ao criar o clone.")
        toast({
          title: "Erro no Treinamento",
          description: result.error || "Ocorreu um erro desconhecido.",
          variant: "destructive",
        })
      } else {
        setSuccessMessage(`Clone "${result.clone.name}" treinado com sucesso! URL do LoRA: ${result.clone.model_id}`)
        toast({
          title: "Clone Treinado!",
          description: `Seu clone "${result.clone.name}" está pronto.`,
        })
        // Optionally redirect or clear form
        router.push(`/clones/${result.clone.id}`) // Navigate to the clone detail page
        router.refresh()
      }
    } catch (err) {
      console.error("Erro ao criar clone:", err)
      setError("Ocorreu um erro inesperado.")
      toast({
        title: "Erro Inesperado",
        description: "Não foi possível completar o treinamento.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setImageQualityMet(images.length >= 3 && images.length <= 10)
  }, [images.length])

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Clone (Treinamento Rápido)</CardTitle>
          <CardDescription>
            Treine um modelo LoRA rapidamente com seu estilo. Envie de 3 a 10 imagens públicas.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {error && (
            <div className="flex items-center p-3 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center p-3 space-x-2 text-sm text-green-600 border border-green-200 rounded-md bg-green-50 dark:text-green-400 dark:border-green-900 dark:bg-green-950/50">
              <CheckCircle className="w-4 h-4" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Nome do Clone</Label>
            <Input
              id="name"
              placeholder="Ex: MeuEstiloRapido"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={50}
              disabled={isLoading}
            />
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="images-upload">Imagens de Referência ({images.length}/10)</Label>
            <div className="p-4 border-2 border-dashed rounded-md border-gray-300 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center space-y-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <p className="text-sm font-medium">Arraste e solte ou clique para selecionar</p>
                <p className="text-xs text-gray-500">JPG ou PNG, máx. 5MB cada. Mínimo 3, máximo 10 imagens.</p>
                <Input
                  id="images-upload"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleImageChange}
                  className="sr-only"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("images-upload")?.click()}
                  disabled={isLoading || images.length >= 10}
                >
                  Selecionar Imagens
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Estas imagens serão enviadas para um armazenamento público para o treinamento.
            </p>
          </div>

          {previewUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {previewUrls.map((url, index) => (
                <div key={index} className="relative group aspect-square">
                  <img
                    src={url || "/placeholder.svg"}
                    alt={`Preview ${index + 1}`}
                    className="object-cover w-full h-full rounded-md"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    disabled={isLoading}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {images.length < 10 && (
                <button
                  type="button"
                  onClick={() => document.getElementById("images-upload")?.click()}
                  disabled={isLoading}
                  className="flex flex-col items-center justify-center border-2 border-dashed rounded-md aspect-square text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="mt-1 text-xs">Adicionar</span>
                </button>
              )}
            </div>
          )}

          {images.length > 0 && (
            <div className="mt-4">
              <ImageQualityIndicators imageCount={images.length} />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="triggerWord">Palavra-Gatilho (Trigger)</Label>
            <Input
              id="triggerWord"
              placeholder="Ex: meuEstiloTrigger"
              value={triggerWord}
              onChange={(e) => setTriggerWord(e.target.value)}
              maxLength={30}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">Palavra para identificar seu clone. Sem espaços.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="steps">Passos de Treinamento (Steps): {steps}</Label>
            <Slider
              id="steps"
              min={100}
              max={1000}
              step={50}
              value={[steps]}
              onValueChange={(val) => setSteps(val[0])}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">Padrão: 750. Ajuste para qualidade vs. velocidade.</p>
          </div>

          <div className="pt-4 border-t">
            <Button type="submit" className="w-full" disabled={isLoading || !imageQualityMet}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Treinando...
                </>
              ) : (
                "Iniciar Treinamento Rápido do Clone"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Treinamento Rápido de LoRA</h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
              <li>Este método usa o endpoint `flux-lora-fast-training` da Fal.ai.</li>
              <li>Requer que as imagens sejam publicamente acessíveis (serão enviadas para o armazenamento).</li>
              <li>O resultado é um link direto para download do arquivo LoRA (.zip).</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

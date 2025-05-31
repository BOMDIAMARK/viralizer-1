"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { AlertCircle, Upload, X, ImageIcon, Info, Settings, Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { createClone } from "../actions"
import { Progress } from "@/components/ui/progress"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ImageQualityIndicators } from "./image-quality-indicators"

interface CreateCloneFormProps {
  userId: string
}

interface FalConfig {
  triggerWord: string
  steps: number
  batchSize: number
  learningRate: number
  numEpochs: number
  guidanceScale: number
  seed: number
}

const defaultFalConfig: FalConfig = {
  triggerWord: "",
  steps: 100,
  batchSize: 4,
  learningRate: 1e-4,
  numEpochs: 3,
  guidanceScale: 7.5,
  seed: 2025,
}

export default function CreateCloneForm({ userId }: CreateCloneFormProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  const [falConfig, setFalConfig] = useState<FalConfig>(defaultFalConfig)
  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null)
  const [trainingProgress, setTrainingProgress] = useState(0)
  const [falTrainId, setFalTrainId] = useState<string | null>(null)
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

  const handleFalConfigChange = (field: keyof FalConfig, value: string | number) => {
    setFalConfig((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setError("O nome do clone é obrigatório.")
      return
    }
    if (!falConfig.triggerWord.trim()) {
      setError("A palavra-gatilho é obrigatória.")
      return
    }
    if (images.length < 3) {
      setError("Você precisa enviar pelo menos 3 imagens.")
      return
    }

    setIsLoading(true)
    setError(null)
    setTrainingStatus("Iniciando treinamento...")
    setTrainingProgress(0)

    const formData = new FormData()
    formData.append("name", name)
    formData.append("description", description)
    formData.append("userId", userId)
    images.forEach((image, index) => formData.append(`image-${index}`, image))

    // Append Fal.ai config
    formData.append("triggerWord", falConfig.triggerWord)
    formData.append("steps", falConfig.steps.toString())
    formData.append("batchSize", falConfig.batchSize.toString())
    formData.append("learningRate", falConfig.learningRate.toString())
    formData.append("numEpochs", falConfig.numEpochs.toString())
    formData.append("guidanceScale", falConfig.guidanceScale.toString())
    formData.append("seed", falConfig.seed.toString())

    try {
      const result = await createClone(formData)
      if (result.error || !result.falTrainId) {
        setError(result.error || "Falha ao iniciar o treinamento.")
        setTrainingStatus(`Falha: ${result.error || "Erro desconhecido"}`)
        setIsLoading(false)
        return
      }
      setFalTrainId(result.falTrainId)
      setTrainingStatus("Treinamento em processamento...")
      toast({
        title: "Treinamento iniciado!",
        description: "Seu clone está sendo treinado. Você pode acompanhar o progresso aqui.",
      })
    } catch (err) {
      console.error("Erro ao criar clone:", err)
      setError("Ocorreu um erro inesperado.")
      setTrainingStatus("Falha ao iniciar.")
      setIsLoading(false)
    }
  }

  // Polling for Fal.ai status
  useEffect(() => {
    if (!falTrainId || !isLoading) return

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/fal-status/${falTrainId}`)
        if (!res.ok) {
          const errorData = await res.json()
          console.warn("Polling error:", errorData.error)
          // Potentially stop polling on certain errors or after too many attempts
          return
        }
        const data = await res.json()
        setTrainingProgress(data.metrics?.progress || trainingProgress)

        if (data.status === "processing") {
          setTrainingStatus(`Processando... (${(data.metrics?.progress || 0).toFixed(0)}%)`)
        } else if (data.status === "succeeded") {
          setTrainingStatus("Clone treinado com sucesso!")
          setTrainingProgress(100)
          setIsLoading(false)
          clearInterval(intervalId)
          toast({ title: "Clone Treinado!", description: "Seu novo clone está pronto para ser usado." })
          router.push(`/clones/${data.output?.model_id || ""}`) // Or to the specific clone page if you have one by Fal model ID
          router.refresh()
        } else if (data.status === "failed") {
          setTrainingStatus(`Falha no treinamento: ${data.error?.message || "Erro desconhecido"}`)
          setError(data.error?.message || "O treinamento falhou.")
          setIsLoading(false)
          clearInterval(intervalId)
        } else if (data.status) {
          // Other statuses like "queued"
          setTrainingStatus(`Status: ${data.status} (${(data.metrics?.progress || 0).toFixed(0)}%)`)
        }
      } catch (error) {
        console.error("Error polling Fal.ai status:", error)
        // Potentially stop polling
      }
    }, 5000) // Poll every 5 seconds

    return () => clearInterval(intervalId)
  }, [falTrainId, isLoading, router, trainingProgress])

  useEffect(() => {
    setImageQualityMet(images.length >= 3 && images.length <= 10)
  }, [images.length])

  if (isLoading && falTrainId) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Treinando seu Clone: {name}</CardTitle>
          <CardDescription>Aguarde enquanto a IA aprende seu estilo. Isso pode levar alguns minutos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <ImageQualityIndicators imageCount={images.length} />
          <div className="flex items-center space-x-2 pt-4">
            <Loader2 className="h-5 w-5 animate-spin" />
            <p className="text-sm text-muted-foreground">{trainingStatus}</p>
          </div>
          <Progress value={trainingProgress} className="w-full" />
          {error && (
            <div className="flex items-center p-3 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Clone</CardTitle>
          <CardDescription>Treine um modelo com seu estilo único. Envie de 3 a 10 imagens.</CardDescription>
        </CardHeader>
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
            <Label htmlFor="triggerWord">Palavra-Gatilho</Label>
            <Input
              id="triggerWord"
              placeholder="Ex: meuEstiloUnico"
              value={falConfig.triggerWord}
              onChange={(e) => handleFalConfigChange("triggerWord", e.target.value)}
              maxLength={30}
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              Palavra para ativar seu clone ao gerar imagens. Sem espaços, use camelCase ou underscore.
            </p>
          </div>

          <div>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
              className="text-sm p-0 h-auto"
            >
              <Settings className="w-4 h-4 mr-2" />
              Configurações Avançadas de Treinamento{" "}
              {showAdvancedConfig ? <X className="w-4 h-4 ml-1" /> : <Info className="w-4 h-4 ml-1" />}
            </Button>
          </div>

          {showAdvancedConfig && (
            <Card className="bg-muted/50">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="steps">Passos (Steps): {falConfig.steps}</Label>
                  <Slider
                    id="steps"
                    min={50}
                    max={150}
                    step={25}
                    value={[falConfig.steps]}
                    onValueChange={(val) => handleFalConfigChange("steps", val[0])}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">
                    Padrão: 100. Mais steps = maior fidelidade, maior custo.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="batchSize">Batch Size</Label>
                    <Select
                      value={falConfig.batchSize.toString()}
                      onValueChange={(val) => handleFalConfigChange("batchSize", Number.parseInt(val))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="4">4 (Padrão)</SelectItem>
                        <SelectItem value="8">8</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Padrão: 4.</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="numEpochs">Épocas (Num Epochs)</Label>
                    <Select
                      value={falConfig.numEpochs.toString()}
                      onValueChange={(val) => handleFalConfigChange("numEpochs", Number.parseInt(val))}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3 (Padrão)</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Padrão: 3.</p>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="learningRate">
                    Taxa de Aprendizado (LR): {falConfig.learningRate.toExponential(1)}
                  </Label>
                  <Input
                    type="number"
                    id="learningRate"
                    step="0.00001"
                    value={falConfig.learningRate}
                    onChange={(e) => handleFalConfigChange("learningRate", Number.parseFloat(e.target.value))}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 1e-4.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guidanceScale">Escala de Orientação: {falConfig.guidanceScale.toFixed(1)}</Label>
                  <Slider
                    id="guidanceScale"
                    min={5.0}
                    max={10.0}
                    step={0.1}
                    value={[falConfig.guidanceScale]}
                    onValueChange={(val) => handleFalConfigChange("guidanceScale", val[0])}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 7.5. Define fidelidade ao estilo.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="seed">Seed</Label>
                  <Input
                    type="number"
                    id="seed"
                    value={falConfig.seed}
                    onChange={(e) => handleFalConfigChange("seed", Number.parseInt(e.target.value))}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 2025. Para reprodutibilidade.</p>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="pt-4 border-t">
            <Button type="submit" className="w-full" disabled={isLoading || !imageQualityMet}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Treinando...
                </>
              ) : (
                "Iniciar Treinamento do Clone"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="p-4 border border-blue-200 rounded-md bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-blue-500 dark:text-blue-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">Dicas para Melhores Clones</h3>
            <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 list-disc list-inside space-y-1">
              <li>Use imagens de alta qualidade (mín. 512x512px).</li>
              <li>Inclua variações de ângulos, expressões e iluminação.</li>
              <li>Evite fundos muito poluídos ou com muitas pessoas.</li>
              <li>O treinamento pode levar de 5 a 10 minutos.</li>
            </ul>
          </div>
        </div>
      </div>
    </form>
  )
}

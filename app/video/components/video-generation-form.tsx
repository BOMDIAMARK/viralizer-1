"use client"

import type React from "react"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Loader2, Sparkles, Film, Download, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { startVideoGeneration, getVideoStatus, type VideoGenerationResult } from "../actions"
import VideoPlayer from "./video-player"

interface VideoGenerationFormProps {
  userId: string
  // Add credits or premium status if needed
}

export default function VideoGenerationForm({ userId }: VideoGenerationFormProps) {
  const [isPending, startTransition] = useTransition()
  const [prompt, setPrompt] = useState("")
  const [lengthSeconds, setLengthSeconds] = useState(10)
  const [fps, setFps] = useState(24)
  const [resolution, setResolution] = useState<"480p" | "720p" | "1080p">("720p")
  const [seed, setSeed] = useState<string>("")

  const [currentVideo, setCurrentVideo] = useState<VideoGenerationResult | null>(null)
  const [isLoadingVideo, setIsLoadingVideo] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim()) {
      toast({ title: "Erro", description: "Por favor, insira um prompt.", variant: "destructive" })
      return
    }

    setIsLoadingVideo(true)
    setCurrentVideo(null)

    const formData = new FormData()
    formData.append("prompt", prompt)
    formData.append("length_seconds", lengthSeconds.toString())
    formData.append("fps", fps.toString())
    formData.append("resolution", resolution)
    if (seed) formData.append("seed", seed)

    startTransition(async () => {
      const result = await startVideoGeneration(formData)
      if (result.error) {
        toast({ title: "Erro na Geração", description: result.error, variant: "destructive" })
        setIsLoadingVideo(false)
      } else if (result.predictionId) {
        toast({
          title: "Geração Iniciada",
          description: "Seu vídeo está sendo processado. Isso pode levar alguns minutos.",
        })
        setCurrentVideo(result)
        // Start polling for status (or rely on webhook to update UI via revalidation/realtime)
        pollVideoStatus(result.predictionId)
      }
    })
  }

  const pollVideoStatus = async (predictionId: string) => {
    const interval = setInterval(async () => {
      const statusResult = await getVideoStatus(predictionId)
      if (statusResult.error) {
        toast({ title: "Erro ao buscar status", description: statusResult.error, variant: "destructive" })
        setIsLoadingVideo(false)
        clearInterval(interval)
        return
      }

      setCurrentVideo((prev) => ({ ...prev, ...statusResult }))

      if (
        statusResult.status === "succeeded" ||
        statusResult.status === "failed" ||
        statusResult.status === "canceled"
      ) {
        setIsLoadingVideo(false)
        clearInterval(interval)
        if (statusResult.status === "succeeded" && statusResult.videoUrl) {
          toast({ title: "Vídeo Gerado!", description: "Seu vídeo está pronto." })
        } else if (statusResult.status === "failed") {
          toast({
            title: "Falha na Geração",
            description: statusResult.error || "Ocorreu um erro ao gerar o vídeo.",
            variant: "destructive",
          })
        }
      }
    }, 5000) // Poll every 5 seconds
  }

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString())
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Film className="w-6 h-6 mr-2" />
          Gerar Vídeo com IA
        </CardTitle>
        <CardDescription>Descreva a cena que você deseja criar e nós a transformaremos em vídeo.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Ex: Um astronauta dançando na lua com montanhas coloridas ao fundo, estilo synthwave."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              required
            />
            <p className="text-xs text-muted-foreground">
              Seja específico para melhores resultados. Mínimo 20 caracteres.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="length_seconds">Duração (segundos)</Label>
              <Input
                id="length_seconds"
                type="number"
                value={lengthSeconds}
                onChange={(e) => setLengthSeconds(Math.max(1, Number.parseInt(e.target.value)))}
                min="1"
                max="60" // Example max
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fps">FPS (Frames por segundo)</Label>
              <Select value={fps.toString()} onValueChange={(val) => setFps(Number.parseInt(val))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 FPS</SelectItem>
                  <SelectItem value="24">24 FPS (Cinemático)</SelectItem>
                  <SelectItem value="30">30 FPS (Fluido)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="resolution">Resolução</Label>
              <Select value={resolution} onValueChange={(val: "480p" | "720p" | "1080p") => setResolution(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="480p">480p (Rápido)</SelectItem>
                  <SelectItem value="720p">720p (HD - Recomendado)</SelectItem>
                  <SelectItem value="1080p">1080p (Full HD - Premium)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seed">Seed (Opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="seed"
                type="number"
                placeholder="Deixe em branco para aleatório"
                value={seed}
                onChange={(e) => setSeed(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={generateRandomSeed} className="shrink-0">
                <RefreshCw className="w-4 h-4 mr-2" /> Aleatório
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Use um número fixo para resultados reproduzíveis.</p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-4">
          <Button type="submit" disabled={isPending || isLoadingVideo} className="w-full">
            {isPending || isLoadingVideo ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {isLoadingVideo ? `Processando... (${currentVideo?.status || "iniciando"})` : "Gerar Vídeo"}
          </Button>

          {currentVideo?.videoUrl && !isLoadingVideo && (
            <div className="w-full mt-6 p-4 border rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-center">Vídeo Gerado!</h3>
              <VideoPlayer src={currentVideo.videoUrl} prompt={prompt} />
              <Button asChild variant="outline" className="w-full mt-4">
                <a href={currentVideo.videoUrl} download={`video_${currentVideo.predictionId}.mp4`}>
                  <Download className="w-4 h-4 mr-2" /> Baixar Vídeo
                </a>
              </Button>
            </div>
          )}
          {isLoadingVideo && currentVideo?.status && (
            <div className="w-full mt-6 p-4 border rounded-lg text-center">
              <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-primary" />
              <p className="text-lg font-semibold">Processando seu vídeo...</p>
              <p className="text-sm text-muted-foreground">Status: {currentVideo.status}</p>
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div
                  className="bg-primary h-2.5 rounded-full animate-pulse"
                  style={{
                    width: `${currentVideo.status === "processing" ? "50%" : currentVideo.status === "succeeded" ? "100%" : "10%"}`,
                  }}
                ></div>
              </div>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

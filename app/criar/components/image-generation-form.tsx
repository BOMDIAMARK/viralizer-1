"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Sparkles, Crown, ImageIcon, Palette, MinusCircle, Crop, Brain } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generateImage, testFalConnection, simulateImageGeneration } from "../actions"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { getAvailableImageModels } from "@/lib/replicate-client"

interface Clone {
  id: string
  name: string
  model_id: string | null
}

interface ImageGenerationFormProps {
  userId: string
  credits: number
  isPremium: boolean
  userClones: Clone[]
}

// Estilos pré-definidos disponíveis
const predefinedStyles = [
  { id: "realistic", name: "Realista", premium: false, description: "Fotos realistas de alta qualidade" },
  { id: "portrait", name: "Retrato", premium: true, description: "Retratos profissionais com Flux Pro" },
  { id: "anime", name: "Anime", premium: false, description: "Estilo de animação japonesa" },
  { id: "cartoon", name: "Cartoon", premium: false, description: "Desenho animado colorido" },
  { id: "digital-art", name: "Arte Digital", premium: true, description: "Arte conceitual com Flux Pro" },
  { id: "oil-painting", name: "Pintura a Óleo", premium: false, description: "Estilo clássico de pintura" },
  { id: "pixel-art", name: "Pixel Art", premium: false, description: "Estilo retrô 8-bit" },
  { id: "cyberpunk", name: "Cyberpunk", premium: false, description: "Futurista com neon" },
  { id: "watercolor", name: "Aquarela", premium: false, description: "Pintura em aquarela" },
  { id: "pencil-sketch", name: "Desenho a Lápis", premium: false, description: "Esboços artísticos" },
  { id: "flat-design", name: "Design Flat", premium: false, description: "Design minimalista" },
  { id: "landscape", name: "Paisagem", premium: false, description: "Fotografias de paisagens" },
  { id: "abstract", name: "Abstrato", premium: false, description: "Arte abstrata moderna" },
  { id: "vintage", name: "Vintage", premium: false, description: "Estilo retrô nostálgico" },
  { id: "minimalist", name: "Minimalista", premium: false, description: "Design limpo e simples" },
]

// Tamanhos de imagem disponíveis
const imageSizes = [
  { id: "square_hd", name: "Quadrado HD", dimensions: "1024×1024", ratio: "1:1" },
  { id: "square", name: "Quadrado", dimensions: "512×512", ratio: "1:1" },
  { id: "portrait_4_3", name: "Retrato 4:3", dimensions: "768×1024", ratio: "3:4" },
  { id: "portrait_16_9", name: "Retrato 16:9", dimensions: "576×1024", ratio: "9:16" },
  { id: "landscape_4_3", name: "Paisagem 4:3", dimensions: "1024×768", ratio: "4:3" },
  { id: "landscape_16_9", name: "Paisagem 16:9", dimensions: "1024×576", ratio: "16:9" },
]

export default function ImageGenerationForm({ userId, credits, isPremium, userClones }: ImageGenerationFormProps) {
  const availableImageModels = useMemo(() => getAvailableImageModels(), [])
  const [prompt, setPrompt] = useState("")
  const [negativePrompt, setNegativePrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [cloneId, setCloneId] = useState("")
  const [imageSize, setImageSize] = useState("landscape_4_3")
  const [guidanceScale, setGuidanceScale] = useState([3.5])
  const [numInferenceSteps, setNumInferenceSteps] = useState([28])
  const [seed, setSeed] = useState("")
  const [activeTab, setActiveTab] = useState(userClones.length > 0 ? "style" : "style")
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [generationInfo, setGenerationInfo] = useState<any>(null)
  const [isTestingConnection, setIsTestingConnection] = useState(false)
  const [useSimulation, setUseSimulation] = useState(false)
  const [imageModel, setImageModel] = useState(availableImageModels[0]?.id || "stable-diffusion-xl")
  const router = useRouter()

  // Get the currently selected model's name for display
  const currentImageModelName = useMemo(() => {
    const model = availableImageModels.find((m) => m.id === imageModel)
    return model ? model.name : "Modelo Desconhecido"
  }, [imageModel, availableImageModels])

  const selectedStyle = predefinedStyles.find((s) => s.id === style)
  const selectedSize = imageSizes.find((s) => s.id === imageSize)
  const willUsePro = isPremium && selectedStyle?.premium && activeTab === "style"

  const handleTestConnection = async () => {
    setIsTestingConnection(true)
    try {
      const result = await testFalConnection()
      if (result.error) {
        toast({
          title: "Erro de conexão",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Conexão OK",
          description: "Serviço de IA está funcionando corretamente.",
        })
      }
    } catch (error) {
      toast({
        title: "Erro de teste",
        description: "Não foi possível testar a conexão.",
        variant: "destructive",
      })
    } finally {
      setIsTestingConnection(false)
    }
  }

  const handleGenerate = async () => {
    // Verificar se o usuário tem créditos suficientes
    if (credits < 1) {
      toast({
        title: "Créditos insuficientes",
        description: "Você não tem créditos suficientes para gerar uma imagem.",
        variant: "destructive",
      })
      return
    }

    // Validar o prompt
    if (!prompt.trim()) {
      setError("Por favor, insira um prompt para gerar a imagem.")
      return
    }

    // Verificar se estilo premium está sendo usado sem ser premium
    if (selectedStyle?.premium && !isPremium && activeTab === "style") {
      toast({
        title: "Recurso Premium",
        description: "Este estilo está disponível apenas para usuários premium.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)
    setPreview(null)
    setGenerationInfo(null)

    try {
      console.log("Iniciando geração de imagem...")

      let result

      // Usar simulação se ativada (para testes)
      if (useSimulation) {
        result = await simulateImageGeneration({
          prompt,
          style: activeTab === "clone" ? "clone" : style,
          userId,
        })
      } else {
        // Gerar a imagem usando Server Action
        result = await generateImage({
          prompt,
          negativePrompt,
          style: activeTab === "clone" ? "clone" : style,
          userId,
          cloneId: activeTab === "clone" ? cloneId : null,
          imageSize,
          guidanceScale: guidanceScale[0],
          numInferenceSteps: numInferenceSteps[0],
          seed: seed ? Number.parseInt(seed) : undefined,
          modelId: imageModel, // Pass the selected image model
        })
      }

      console.log("Resultado da geração:", result)

      if (result.error) {
        setError(result.error)
        toast({
          title: "Erro ao gerar imagem",
          description: result.error,
          variant: "destructive",
        })
        return
      }

      // Exibir prévia e informações de geração
      setPreview(result.imageUrl)
      setGenerationInfo({
        model: result.model,
        seed: result.seed,
        generationTime: result.generationTime,
      })

      toast({
        title: "Imagem gerada com sucesso!",
        description: `Gerada com ${result.model} ${result.generationTime ? `em ${result.generationTime.toFixed(2)}s` : ""}`,
      })

      // Redirecionar após um breve delay para exibir a prévia
      setTimeout(() => {
        router.push(`/imagem/${result.imageId}`)
        router.refresh()
      }, 2000)
    } catch (err) {
      console.error("Erro ao gerar imagem:", err)
      setError("Ocorreu um erro inesperado ao tentar gerar a imagem.")
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1000000).toString())
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] p-4">
      {/* Image Placeholder / Preview */}
      <div className="relative w-full max-w-3xl aspect-square mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center w-full h-full animate-pulse bg-gray-200 dark:bg-gray-700">
            <div className="w-16 h-16 mb-4 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin dark:border-t-violet-400 dark:border-violet-700" />
            <p className="text-lg text-gray-600 dark:text-gray-400">{`Gerando com ${currentImageModelName}...`}</p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">Isso pode levar até 30 segundos</p>
          </div>
        ) : preview ? (
          <img
            src={preview || "/placeholder.svg"}
            alt="Imagem gerada"
            className="object-contain w-full h-full" // Use object-contain to fit the image without cropping
          />
        ) : (
          <div className="flex flex-col items-center text-center">
            <ImageIcon className="w-20 h-20 mb-4 text-gray-400 dark:text-gray-600" />
            <h2 className="text-3xl font-bold text-gray-700 dark:text-gray-300">Imagem</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">A prévia da sua imagem aparecerá aqui</p>
          </div>
        )}
      </div>

      {/* Prompt Input Bar */}
      <Card className="w-full max-w-3xl p-2 shadow-lg">
        <CardContent className="p-0">
          <div className="flex items-end gap-2">
            <Textarea
              id="prompt"
              placeholder="Descreva uma imagem e clique em gerar..."
              className="flex-1 min-h-[50px] max-h-[150px] resize-y border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-2"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
            <Button onClick={handleGenerate} disabled={isLoading || credits < 1} className="h-12 px-6">
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
                  Gerando...
                </div>
              ) : (
                <div className="flex items-center">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Gerar
                </div>
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between p-2 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              {/* Style Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Palette className="w-4 h-4" />
                    Estilo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-4">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="style">Estilos</TabsTrigger>
                      <TabsTrigger value="clone" disabled={userClones.length === 0}>
                        Meus Clones {userClones.length === 0 && "(0)"}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="style" className="mt-4 space-y-4">
                      <Select value={style} onValueChange={setStyle}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um estilo" />
                        </SelectTrigger>
                        <SelectContent>
                          {predefinedStyles.map((styleOption) => (
                            <SelectItem key={styleOption.id} value={styleOption.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{styleOption.name}</span>
                                {styleOption.premium && <Crown className="w-3 h-3 ml-2 text-yellow-500" />}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {predefinedStyles.map((styleOption) => (
                          <div
                            key={styleOption.id}
                            className={`p-2 text-center border rounded-md cursor-pointer transition-all relative ${
                              style === styleOption.id
                                ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                                : "border-gray-200 hover:border-violet-300 dark:border-gray-700 dark:hover:border-violet-700"
                            } ${styleOption.premium && !isPremium ? "opacity-50" : ""}`}
                            onClick={() => {
                              if (styleOption.premium && !isPremium) {
                                toast({
                                  title: "Recurso Premium",
                                  description: "Este estilo está disponível apenas para usuários premium.",
                                  variant: "destructive",
                                })
                                return
                              }
                              setStyle(styleOption.id)
                            }}
                          >
                            {styleOption.premium && (
                              <Crown className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />
                            )}
                            <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-1">
                              <img
                                src={`/abstract-geometric-shapes.png?height=100&width=100&query=${styleOption.name} style example`}
                                alt={`Estilo ${styleOption.name}`}
                                className="w-full h-full object-cover rounded-md"
                              />
                            </div>
                            <span className="text-xs">{styleOption.name}</span>
                          </div>
                        ))}
                      </div>
                      {selectedStyle && (
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md text-sm text-blue-800 dark:text-blue-300">
                          <strong>{selectedStyle.name}:</strong> {selectedStyle.description}
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="clone" className="mt-4 space-y-4">
                      {userClones.length === 0 ? (
                        <div className="p-4 text-center border border-dashed rounded-md border-gray-300 dark:border-gray-700">
                          <p className="text-gray-600 dark:text-gray-400">Você ainda não tem clones prontos.</p>
                          <Button variant="link" onClick={() => router.push("/clones/criar")} className="mt-2">
                            Criar meu primeiro clone
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <Select value={cloneId} onValueChange={setCloneId}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um clone" />
                            </SelectTrigger>
                            <SelectContent>
                              {userClones.map((clone) => (
                                <SelectItem key={clone.id} value={clone.id}>
                                  {clone.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                            {userClones.map((clone) => (
                              <div
                                key={clone.id}
                                className={`p-2 text-center border rounded-md cursor-pointer transition-all ${
                                  cloneId === clone.id
                                    ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20"
                                    : "border-gray-200 hover:border-violet-300 dark:border-gray-700 dark:hover:border-violet-700"
                                }`}
                                onClick={() => setCloneId(clone.id)}
                              >
                                <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-1">
                                  <img
                                    src={`/abstract-clone.png?height=100&width=100&query=Clone ${clone.name}`}
                                    alt={`Clone ${clone.name}`}
                                    className="w-full h-full object-cover rounded-md"
                                  />
                                </div>
                                <span className="text-xs">{clone.name}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </PopoverContent>
              </Popover>

              {/* Model Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Brain className="w-4 h-4" />
                    Modelo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4">
                  <h4 className="font-medium mb-2">Selecione o Modelo de IA</h4>
                  <Select value={imageModel} onValueChange={setImageModel}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableImageModels.map((modelOption) => (
                        <SelectItem key={modelOption.id} value={modelOption.id}>
                          <div className="flex flex-col items-start">
                            <span className="font-medium">{modelOption.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{modelOption.description}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PopoverContent>
              </Popover>

              {/* Negative Prompt Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <MinusCircle className="w-4 h-4" />
                    Prompt Negativo
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-4">
                  <h4 className="font-medium mb-2">Prompt Negativo</h4>
                  <Textarea
                    id="negative-prompt"
                    placeholder="Descreva o que você NÃO quer na imagem..."
                    className="min-h-[80px] resize-y"
                    value={negativePrompt}
                    onChange={(e) => setNegativePrompt(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Use para remover elementos indesejados ou melhorar a qualidade.
                  </p>
                </PopoverContent>
              </Popover>

              {/* Aspect Ratio Popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center gap-1">
                    <Crop className="w-4 h-4" />
                    {selectedSize?.ratio || "1:1"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-4">
                  <h4 className="font-medium mb-2">Proporção da Imagem</h4>
                  <Select value={imageSize} onValueChange={setImageSize}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a proporção" />
                    </SelectTrigger>
                    <SelectContent>
                      {imageSizes.map((size) => (
                        <SelectItem key={size.id} value={size.id}>
                          {size.name} ({size.ratio})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PopoverContent>
              </Popover>
            </div>

            {/* Credits display */}
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">{credits}</span> créditos
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Model Selector at bottom left */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="font-medium">Modelo:</span>
        <Badge variant="secondary">{currentImageModelName}</Badge>
      </div>

      {/* Test Connection Button at bottom right (for dev/debug) */}
      <div className="absolute bottom-4 right-4">
        <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTestingConnection}>
          {isTestingConnection ? "Testando..." : "Testar Conexão"}
        </Button>
      </div>

      {/* Error display (if any) */}
      {error && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-50 flex items-center p-3 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Sparkles, Info, Settings, Zap, Crown } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { generateImage, testFalConnection, simulateImageGeneration } from "../actions"

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
  initialPrompt?: string
  initialStyle?: string
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

export default function ImageGenerationForm({
  userId,
  credits,
  isPremium,
  userClones,
  initialPrompt,
  initialStyle,
}: ImageGenerationFormProps) {
  const [prompt, setPrompt] = useState(initialPrompt || "")
  const [style, setStyle] = useState(initialStyle || "realistic")
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
  const router = useRouter()

  // Se há um estilo inicial e clones disponíveis, verificar se é um clone
  useEffect(() => {
    if (initialStyle && userClones.some((clone) => clone.id === initialStyle)) {
      setCloneId(initialStyle)
      setActiveTab("clone")
    }
  }, [initialStyle, userClones])

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
          style: activeTab === "clone" ? "clone" : style,
          userId,
          cloneId: activeTab === "clone" ? cloneId : null,
          imageSize,
          guidanceScale: guidanceScale[0],
          numInferenceSteps: numInferenceSteps[0],
          seed: seed ? Number.parseInt(seed) : undefined,
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
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Configurações de Geração</span>
              <div className="flex items-center space-x-2">
                {willUsePro && (
                  <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                    <Crown className="w-3 h-3 mr-1" />
                    Flux Pro
                  </Badge>
                )}
                <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={isTestingConnection}>
                  {isTestingConnection ? "Testando..." : "Testar Conexão"}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="flex items-center p-3 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="prompt">Prompt</Label>
              <Textarea
                id="prompt"
                placeholder="Descreva a imagem que você deseja criar..."
                className="min-h-[100px]"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Seja específico e detalhado para obter melhores resultados.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageSize">Tamanho da Imagem</Label>
              <Select value={imageSize} onValueChange={setImageSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho" />
                </SelectTrigger>
                <SelectContent>
                  {imageSizes.map((size) => (
                    <SelectItem key={size.id} value={size.id}>
                      {size.name} ({size.dimensions}) - {size.ratio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="style">Estilos</TabsTrigger>
                <TabsTrigger value="clone" disabled={userClones.length === 0}>
                  Meus Clones {userClones.length === 0 && "(0)"}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="style" className="space-y-4">
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

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                      {styleOption.premium && <Crown className="absolute top-1 right-1 w-3 h-3 text-yellow-500" />}
                      <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-2">
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
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      <strong>{selectedStyle.name}:</strong> {selectedStyle.description}
                      {selectedStyle.premium && isPremium && (
                        <span className="ml-2 text-purple-600 dark:text-purple-400">
                          • Será gerado com Flux Pro para máxima qualidade
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clone" className="space-y-4">
                {userClones.length === 0 ? (
                  <div className="p-4 text-center border border-dashed rounded-md border-gray-300 dark:border-gray-700">
                    <p className="text-gray-600 dark:text-gray-400">
                      Você ainda não tem clones prontos. Crie seu primeiro clone para treinar um modelo com seu estilo
                      único.
                    </p>
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

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
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
                          <div className="aspect-square bg-gray-100 dark:bg-gray-800 rounded-md mb-2">
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

            {/* Configurações Avançadas */}
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full justify-start"
              >
                <Settings className="w-4 h-4 mr-2" />
                Configurações Avançadas
                {showAdvanced ? " (Ocultar)" : " (Mostrar)"}
              </Button>

              {showAdvanced && (
                <div className="space-y-4 p-4 border rounded-md bg-gray-50 dark:bg-gray-800/50">
                  <div className="space-y-2">
                    <Label htmlFor="guidance">Guidance Scale: {guidanceScale[0]}</Label>
                    <Slider
                      id="guidance"
                      min={1}
                      max={20}
                      step={0.5}
                      value={guidanceScale}
                      onValueChange={setGuidanceScale}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Controla o quanto a IA segue o prompt (1-20, recomendado: 3.5)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="steps">Inference Steps: {numInferenceSteps[0]}</Label>
                    <Slider
                      id="steps"
                      min={4}
                      max={50}
                      step={1}
                      value={numInferenceSteps}
                      onValueChange={setNumInferenceSteps}
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500">
                      Número de passos de refinamento (4-50, mais passos = melhor qualidade)
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="seed">Seed (opcional)</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="seed"
                        placeholder="Ex: 123456"
                        value={seed}
                        onChange={(e) => setSeed(e.target.value)}
                        type="number"
                      />
                      <Button variant="outline" size="sm" onClick={generateRandomSeed}>
                        <Zap className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">Use o mesmo seed para reproduzir resultados similares</p>
                  </div>

                  {/* Opção de simulação (para desenvolvimento) */}
                  <div className="flex items-center space-x-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                    <input
                      type="checkbox"
                      id="useSimulation"
                      checked={useSimulation}
                      onChange={(e) => setUseSimulation(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="useSimulation" className="text-sm text-amber-600 dark:text-amber-400">
                      Usar simulação (modo de desenvolvimento)
                    </Label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                <Info className="w-4 h-4 mr-1" />
                <span>Custo: 1 crédito</span>
                {selectedSize && <span className="ml-2">• {selectedSize.dimensions}</span>}
              </div>
              <Button onClick={handleGenerate} disabled={isLoading || credits < 1}>
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-2 border-t-transparent border-white rounded-full animate-spin" />
                    Gerando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Sparkles className="w-4 h-4 mr-2" />
                    Gerar Imagem
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="p-4 border border-orange-200 rounded-md bg-orange-50 dark:bg-orange-900/20 dark:border-orange-800">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <Info className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800 dark:text-orange-300">
                Dicas para melhores resultados com Flux Dev
              </h3>
              <div className="mt-2 text-sm text-orange-700 dark:text-orange-300">
                <ul className="space-y-1 list-disc list-inside">
                  <li>Use prompts detalhados e específicos para melhores resultados</li>
                  <li>Experimente diferentes valores de Guidance Scale (3.5 é ideal para a maioria dos casos)</li>
                  <li>Mais steps de inferência resultam em maior qualidade, mas demoram mais</li>
                  <li>Usuários premium têm acesso ao Flux Pro para estilos específicos</li>
                  <li>Use seeds para reproduzir variações de imagens que você gostou</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Prévia</h3>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">{credits}</span> créditos disponíveis
                </div>
              </div>

              <div className="overflow-hidden border border-gray-200 rounded-md aspect-square dark:border-gray-700">
                {isLoading ? (
                  <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 mb-4 border-4 border-t-violet-500 border-violet-200 rounded-full animate-spin dark:border-t-violet-400 dark:border-violet-700" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {willUsePro ? "Gerando com Flux Pro..." : "Gerando com Flux Dev..."}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Isso pode levar até 30 segundos</p>
                    </div>
                  </div>
                ) : preview ? (
                  <div className="relative">
                    <img
                      src={preview || "/placeholder.svg"}
                      alt="Imagem gerada"
                      className="object-cover w-full h-full"
                    />
                    {generationInfo && (
                      <div className="absolute bottom-2 left-2 right-2 p-2 bg-black/80 text-white text-xs rounded">
                        <div className="flex justify-between items-center">
                          <span>Modelo: {generationInfo.model}</span>
                          <span>Seed: {generationInfo.seed}</span>
                        </div>
                        {generationInfo.generationTime && (
                          <div className="text-center mt-1">Tempo: {generationInfo.generationTime.toFixed(2)}s</div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full h-full bg-gray-100 dark:bg-gray-800">
                    <div className="flex flex-col items-center p-6 text-center">
                      <Sparkles className="w-10 h-10 mb-4 text-gray-400 dark:text-gray-600" />
                      <p className="text-gray-600 dark:text-gray-400">A prévia da sua imagem aparecerá aqui</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                        {willUsePro ? "Será gerado com Flux Pro" : "Será gerado com Flux Dev"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {!preview && (
          <div className="grid grid-cols-2 gap-4">
            <img
              src="/ai-colorful-abstract.png"
              alt="Exemplo 1"
              className="object-cover w-full rounded-md aspect-square"
            />
            <img src="/ai-digital-art.png" alt="Exemplo 2" className="object-cover w-full rounded-md aspect-square" />
          </div>
        )}
      </div>
    </div>
  )
}

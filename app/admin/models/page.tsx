"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Settings, Zap, Eye, Clock, DollarSign, Star, Copy, CheckCircle, RefreshCw } from "lucide-react"
import { getRecommendedModels, getModelInfo, MODEL_CAPABILITIES } from "@/lib/model-selector"
import { toast } from "sonner"

export default function ModelsAdminPage() {
  const [currentModel, setCurrentModel] = useState<string>("")
  const [customModelId, setCustomModelId] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [testResults, setTestResults] = useState<any[]>([])

  const recommendedModels = getRecommendedModels()

  useEffect(() => {
    checkCurrentConfiguration()
  }, [])

  const checkCurrentConfiguration = async () => {
    try {
      const response = await fetch("/api/chat/stream")
      const data = await response.json()

      // Verificar se há modelo personalizado configurado
      if (data.replicate?.hasCustomModel) {
        setCurrentModel("Modelo personalizado configurado")
      } else {
        setCurrentModel("Usando modelos padrão")
      }
    } catch (error) {
      console.error("Erro ao verificar configuração:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  const testModel = async (modelId: string) => {
    try {
      const response = await fetch("/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: "Teste rápido",
          forceReplicate: true,
          rawInput: {
            model: modelId,
            prompt: "Responda apenas: 'Modelo funcionando!'",
            max_completion_tokens: 10,
            temperature: 0.1,
          },
        }),
      })

      if (response.ok) {
        toast.success(`✅ Modelo ${modelId} funcionando!`)
        return true
      } else {
        toast.error(`❌ Erro ao testar ${modelId}`)
        return false
      }
    } catch (error) {
      toast.error(`❌ Erro de conexão com ${modelId}`)
      return false
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Carregando configuração...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Configuração de Modelos</h1>
          <p className="text-muted-foreground">Configure modelos personalizados para otimizar performance e custos</p>
        </div>
      </div>

      <Tabs defaultValue="recommended" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommended">Modelos Recomendados</TabsTrigger>
          <TabsTrigger value="custom">Configuração Personalizada</TabsTrigger>
          <TabsTrigger value="capabilities">Capacidades</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          <Alert>
            <Zap className="h-4 w-4" />
            <AlertDescription>
              <strong>Status atual:</strong> {currentModel}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(recommendedModels).map(([use, modelId]) => {
              const info = getModelInfo(modelId)
              return (
                <Card key={use}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {use === "thumbnailAnalysis" && <Eye className="w-5 h-5" />}
                      {use === "generalChat" && <Zap className="w-5 h-5" />}
                      {use === "creativeAnalysis" && <Star className="w-5 h-5" />}
                      {use === "quickResponse" && <Clock className="w-5 h-5" />}
                      {use.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="font-mono text-sm bg-muted p-2 rounded">{modelId}</div>

                    {info && (
                      <div className="flex flex-wrap gap-2">
                        {info.vision && (
                          <Badge variant="secondary">
                            <Eye className="w-3 h-3 mr-1" />
                            Visão
                          </Badge>
                        )}
                        <Badge variant="outline">
                          <DollarSign className="w-3 h-3 mr-1" />
                          {info.costTier}
                        </Badge>
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {info.speed}
                        </Badge>
                        <Badge variant="outline">
                          <Star className="w-3 h-3 mr-1" />
                          {info.quality}
                        </Badge>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyToClipboard(modelId)}>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar ID
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => testModel(modelId)}>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Testar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Modelo Personalizado</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-id">ID do Modelo</Label>
                <Input
                  id="model-id"
                  value={customModelId}
                  onChange={(e) => setCustomModelId(e.target.value)}
                  placeholder="Ex: openai/gpt-4o"
                />
              </div>

              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Como configurar:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Copie o ID do modelo desejado</li>
                    <li>Acesse o dashboard do Vercel</li>
                    <li>Vá em Settings → Environment Variables</li>
                    <li>
                      Adicione: <code>VIRALIZER_MODEL_ID</code>
                    </li>
                    <li>Cole o ID do modelo como valor</li>
                    <li>Redeploy o projeto</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="flex gap-2">
                <Button
                  onClick={() => copyToClipboard(`VIRALIZER_MODEL_ID=${customModelId}`)}
                  disabled={!customModelId}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  Copiar Configuração
                </Button>
                <Button variant="outline" onClick={() => testModel(customModelId)} disabled={!customModelId}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Testar Modelo
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Modelos Populares</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  "openai/gpt-4o",
                  "openai/gpt-4o-mini",
                  "meta/llama-2-70b-chat",
                  "mistralai/mixtral-8x7b-instruct-v0.1",
                ].map((modelId) => (
                  <div key={modelId} className="flex items-center justify-between p-2 border rounded">
                    <span className="font-mono text-sm">{modelId}</span>
                    <Button variant="ghost" size="sm" onClick={() => setCustomModelId(modelId)}>
                      Usar Este
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="capabilities" className="space-y-4">
          <div className="grid gap-4">
            {Object.entries(MODEL_CAPABILITIES).map(([modelId, caps]) => (
              <Card key={modelId}>
                <CardHeader>
                  <CardTitle className="font-mono text-sm">{modelId}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">Visão: {caps.vision ? "✅" : "❌"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4" />
                      <span className="text-sm">Custo: {caps.costTier}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Velocidade: {caps.speed}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4" />
                      <span className="text-sm">Qualidade: {caps.quality}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

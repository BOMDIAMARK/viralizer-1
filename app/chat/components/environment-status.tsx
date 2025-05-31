"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Settings, ChevronDown, ChevronRight, CheckCircle, AlertTriangle, XCircle, Zap, User, Bot } from "lucide-react"
import { getRequiredEnvironmentVariables, getCurrentModelInfo, RECOMMENDED_MODELS } from "@/lib/replicate-config"

export function EnvironmentStatus() {
  const [isOpen, setIsOpen] = useState(false)
  const envStatus = getRequiredEnvironmentVariables()
  const currentModel = getCurrentModelInfo()

  const getStatusIcon = (configured: boolean, required: boolean) => {
    if (configured) return <CheckCircle className="w-4 h-4 text-green-600" />
    if (required) return <XCircle className="w-4 h-4 text-red-600" />
    return <AlertTriangle className="w-4 h-4 text-orange-600" />
  }

  const getStatusColor = (configured: boolean, required: boolean) => {
    if (configured) return "default"
    if (required) return "destructive"
    return "secondary"
  }

  return (
    <Card className="w-full">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Status da Configuração
                <Badge variant={envStatus.allRequired ? "default" : "destructive"}>
                  {envStatus.configured.length}/{envStatus.variables.length} configuradas
                </Badge>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-4">
            {/* Status Geral */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-sm">API Token</span>
                </div>
                <Badge variant={envStatus.variables[0].configured ? "default" : "destructive"}>
                  {envStatus.variables[0].status}
                </Badge>
              </div>

              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="w-4 h-4 text-purple-600" />
                  <span className="font-medium text-sm">Modelo</span>
                </div>
                <Badge variant={currentModel.configured ? "default" : "outline"}>
                  {currentModel.configured ? currentModel.name : "Padrão"}
                </Badge>
              </div>

              <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-sm">Usuário</span>
                </div>
                <Badge variant={envStatus.variables[2].configured ? "default" : "outline"}>
                  {envStatus.variables[2].status}
                </Badge>
              </div>
            </div>

            {/* Detalhes das Variáveis */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Variáveis de Ambiente:</h4>
              {envStatus.variables.map((variable) => (
                <div key={variable.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(variable.configured, variable.required)}
                    <div>
                      <p className="font-medium text-sm">{variable.name}</p>
                      <p className="text-xs text-muted-foreground">{variable.description}</p>
                      {variable.value && (
                        <p className="text-xs text-muted-foreground mt-1">
                          <strong>Valor:</strong> {variable.value}
                        </p>
                      )}
                    </div>
                  </div>
                  <Badge variant={getStatusColor(variable.configured, variable.required)}>{variable.status}</Badge>
                </div>
              ))}
            </div>

            {/* Informações do Modelo Atual */}
            <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                Modelo Atual: {currentModel.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">{currentModel.description}</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {currentModel.features.map((feature) => (
                  <Badge key={feature} variant="outline" className="text-xs">
                    {feature}
                  </Badge>
                ))}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>
                  <strong>Custo:</strong> {currentModel.costTier}
                </span>
                <span>
                  <strong>Velocidade:</strong> {currentModel.speed}
                </span>
                {currentModel.isCustom && (
                  <Badge variant="secondary" className="text-xs">
                    Personalizado
                  </Badge>
                )}
              </div>
            </div>

            {/* Modelos Recomendados */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Modelos Recomendados:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(RECOMMENDED_MODELS).map(([key, model]) => (
                  <div key={key} className="p-3 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm">{model.name}</h5>
                      {currentModel.id === model.id && (
                        <Badge variant="default" className="text-xs">
                          Atual
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{model.description}</p>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Custo: {model.costTier}</span>
                      <span>Velocidade: {model.speed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alertas e Recomendações */}
            {!envStatus.allRequired && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Configuração Incompleta:</strong> Algumas variáveis obrigatórias não estão configuradas.
                  Configure o REPLICATE_API_TOKEN para ativar a IA avançada.
                </AlertDescription>
              </Alert>
            )}

            {envStatus.allRequired && !currentModel.configured && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recomendação:</strong> Configure o VIRALIZER_MODEL_ID para usar um modelo específico e obter
                  melhor performance. Recomendamos: <code>openai/gpt-4o-mini</code>
                </AlertDescription>
              </Alert>
            )}

            {envStatus.allRequired && currentModel.configured && (
              <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-700 dark:text-green-300">
                  <strong>Configuração Completa!</strong> Todas as variáveis estão configuradas corretamente. O
                  Viralizer está pronto para usar IA avançada.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}

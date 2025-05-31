"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { CheckCircle, Settings, Zap, ChevronDown, ChevronRight, Bot, User, AlertTriangle } from "lucide-react"
import { getReplicateConfigStatus, getCurrentModelInfo } from "@/lib/replicate-config"

export function ReplicateConfigBanner() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [configStatus, setConfigStatus] = useState(getReplicateConfigStatus())
  const [currentModel, setCurrentModel] = useState(getCurrentModelInfo())

  useEffect(() => {
    setConfigStatus(getReplicateConfigStatus())
    setCurrentModel(getCurrentModelInfo())
  }, [])

  // Se tudo estiver configurado, mostrar banner de sucesso compacto
  if (configStatus.configured && configStatus.hasCustomModel && configStatus.hasUsername) {
    return (
      <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="flex items-center justify-between">
          <div className="text-green-700 dark:text-green-300">
            <strong>🚀 Configuração Completa!</strong> IA Avançada ativa com modelo {currentModel.name}
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-green-700">
              <Bot className="w-3 h-3 mr-1" />
              {currentModel.name}
            </Badge>
            <Badge variant="outline" className="text-green-700">
              <User className="w-3 h-3 mr-1" />
              {configStatus.username}
            </Badge>
          </div>
        </AlertDescription>
      </Alert>
    )
  }

  // Se apenas o token estiver configurado
  if (configStatus.configured && !configStatus.hasCustomModel) {
    return (
      <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
        <Zap className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <div className="flex items-center justify-between">
            <div className="text-blue-700 dark:text-blue-300">
              <strong>✅ IA Básica Ativa!</strong> Configure modelo personalizado para melhor performance.
            </div>
            <Button variant="outline" size="sm" onClick={() => setIsExpanded(!isExpanded)}>
              <Settings className="w-4 h-4 mr-1" />
              Otimizar
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded border">
              <h4 className="font-medium text-sm mb-2">Configurações Recomendadas:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>VIRALIZER_MODEL_ID:</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">openai/gpt-4o-mini</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>REPLICATE_USERNAME:</span>
                  <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">seu-usuario</code>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                💡 Adicione essas variáveis no Vercel Dashboard → Settings → Environment Variables
              </p>
            </div>
          )}
        </AlertDescription>
      </Alert>
    )
  }

  // Se nada estiver configurado
  if (!configStatus.configured) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <Alert className="border-orange-200 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <div className="text-orange-700 dark:text-orange-300">
                  <strong>⚙️ Configure a IA Avançada</strong> para análises personalizadas e suporte a imagens
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Modo Básico</Badge>
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
              </div>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-3">
              <div className="p-4 bg-white dark:bg-gray-900 rounded border space-y-4">
                <h4 className="font-medium text-sm">🚀 Guia de Configuração Rápida:</h4>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      1
                    </div>
                    <div>
                      <p className="font-medium text-sm">Obtenha sua API Key</p>
                      <p className="text-xs text-muted-foreground">
                        Acesse{" "}
                        <a
                          href="https://replicate.com"
                          target="_blank"
                          className="text-blue-600 hover:underline"
                          rel="noreferrer"
                        >
                          replicate.com
                        </a>{" "}
                        → Faça login → Account → API Tokens → Create Token
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      2
                    </div>
                    <div>
                      <p className="font-medium text-sm">Configure no Vercel</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Vercel Dashboard → Seu Projeto → Settings → Environment Variables
                      </p>
                      <div className="space-y-1">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                          REPLICATE_API_TOKEN=r8_sua_key_aqui
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                          VIRALIZER_MODEL_ID=openai/gpt-4o-mini
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded text-xs font-mono">
                          REPLICATE_USERNAME=seu-usuario
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600">
                      3
                    </div>
                    <div>
                      <p className="font-medium text-sm">Redeploy e Teste</p>
                      <p className="text-xs text-muted-foreground">
                        Clique em "Redeploy" no Vercel e teste enviando uma mensagem no chat
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <h5 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-1">
                    🎯 Benefícios da IA Avançada:
                  </h5>
                  <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                    <li>• Análise inteligente de thumbnails</li>
                    <li>• Suporte a imagens e URLs</li>
                    <li>• Respostas personalizadas e contextuais</li>
                    <li>• Sugestões criativas avançadas</li>
                  </ul>
                </div>
              </div>
            </CollapsibleContent>
          </AlertDescription>
        </Alert>
      </Collapsible>
    )
  }

  return null
}

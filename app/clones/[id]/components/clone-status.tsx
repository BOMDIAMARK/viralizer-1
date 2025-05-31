import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, AlertTriangle, Clock, Loader2, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface CloneStatusProps {
  status: string
  metadata?: any
}

export default function CloneStatus({ status, metadata }: CloneStatusProps) {
  let statusContent

  switch (status) {
    case "pending":
      statusContent = (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
            <span className="font-medium">Aguardando processamento</span>
          </div>
          <Progress value={0} className="h-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seu clone está na fila para processamento. O treinamento começará em breve.
          </p>
        </div>
      )
      break
    case "training":
      statusContent = (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="font-medium">Treinamento em andamento</span>
          </div>
          <Progress value={50} className="h-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seu clone está sendo treinado com o modelo Flux LoRA Portrait Trainer. Este processo pode levar até 60
            minutos para ser concluído.
          </p>
          {metadata?.request_id && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>Request ID:</strong> {metadata.request_id}
              </p>
            </div>
          )}
        </div>
      )
      break
    case "ready":
      statusContent = (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Treinamento concluído</span>
          </div>
          <Progress value={100} className="h-2" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Seu clone está pronto para uso! Você já pode gerar imagens com seu estilo personalizado.
          </p>
          {metadata?.fal_result && (
            <div className="space-y-3">
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                  <strong>Arquivos do modelo treinado:</strong>
                </p>
                {metadata.fal_result.diffusers_lora_file && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">LoRA Model</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href={metadata.fal_result.diffusers_lora_file.url} download>
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}
                {metadata.fal_result.config_file && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">Config File</span>
                    <Button size="sm" variant="outline" asChild>
                      <a href={metadata.fal_result.config_file.url} download>
                        <Download className="w-3 h-3 mr-1" />
                        Download
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )
      break
    case "failed":
      statusContent = (
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Falha no treinamento</span>
          </div>
          <Progress value={100} className="h-2 bg-red-200 dark:bg-red-900/30" />
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ocorreu um erro durante o treinamento do seu clone. Por favor, tente novamente com imagens diferentes ou
            entre em contato com o suporte.
          </p>
          {metadata?.error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
              <p className="text-sm text-red-800 dark:text-red-300">
                <strong>Erro:</strong> {metadata.error}
              </p>
            </div>
          )}
        </div>
      )
      break
    default:
      statusContent = null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Clone</CardTitle>
      </CardHeader>
      <CardContent>{statusContent}</CardContent>
    </Card>
  )
}

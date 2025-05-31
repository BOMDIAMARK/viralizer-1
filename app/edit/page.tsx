"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useFluxEditor } from "@/hooks/use-flux-editor"
import { FluxImageUploader } from "./components/flux-image-uploader"
import { Loader2, Sparkles } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export default function EditPage() {
  const {
    originalImage,
    editedImage,
    prompt,
    isProcessing,
    error,
    status,
    setOriginalImage,
    setPrompt,
    submitEditRequest,
  } = useFluxEditor()

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Editor de Imagem (Flux)</CardTitle>
          <CardDescription className="text-center">
            Envie uma imagem e descreva as alterações desejadas.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <FluxImageUploader onImageUpload={setOriginalImage} currentImage={originalImage} />

          {originalImage && (
            <>
              <div>
                <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  O que deseja alterar na imagem?
                </label>
                <Textarea
                  id="prompt"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: Adicione óculos escuros ao rosto da pessoa, mantendo estilo realista..."
                  rows={3}
                  className="focus-visible:ring-blue-500"
                />
              </div>
            </>
          )}

          {isProcessing && (
            <div className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Processando imagem... Status: <span className="font-semibold">{status || "iniciando"}</span>
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Isso pode levar alguns instantes.</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/30 p-3 rounded-md">
              Erro: {error}
            </p>
          )}

          {editedImage && !isProcessing && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-2 text-center">Imagem Editada:</h3>
              <img
                src={editedImage || "/placeholder.svg"}
                alt="Edited"
                className="max-w-full max-h-[500px] mx-auto rounded-md border"
              />
            </div>
          )}
        </CardContent>
        {originalImage && (
          <CardFooter>
            <Button
              onClick={submitEditRequest}
              disabled={isProcessing || !prompt || !originalImage}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Gerar Edição
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

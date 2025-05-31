"use client"

import { UploadCloud } from "lucide-react"
import { useCallback } from "react"
import { useDropzone } from "react-dropzone"

interface FluxImageUploaderProps {
  onImageUpload: (base64Image: string) => void
  currentImage?: string | null
}

export function FluxImageUploader({ onImageUpload, currentImage }: FluxImageUploaderProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          onImageUpload(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      }
    },
    [onImageUpload],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  })

  return (
    <div className="w-full">
      {currentImage ? (
        <div className="mb-4 relative group">
          <img
            src={currentImage || "/placeholder.svg"}
            alt="Original"
            className="max-w-full max-h-[400px] mx-auto rounded-md border"
          />
          <div
            {...getRootProps()}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-md"
          >
            <input {...getInputProps()} />
            <p className="text-white text-sm">Trocar imagem</p>
          </div>
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`w-full h-64 border-2 border-dashed rounded-md flex flex-col items-center justify-center cursor-pointer
            ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
            dark:border-gray-600 dark:hover:border-gray-500 ${isDragActive ? "dark:bg-gray-800" : ""}`}
        >
          <input {...getInputProps()} />
          <UploadCloud className={`w-12 h-12 mb-2 ${isDragActive ? "text-blue-500" : "text-gray-400"}`} />
          {isDragActive ? (
            <p className="text-blue-500">Solte a imagem aqui...</p>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">Arraste uma imagem ou clique para selecionar</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">PNG, JPG, WEBP (Max 1024px recomendado)</p>
        </div>
      )}
    </div>
  )
}

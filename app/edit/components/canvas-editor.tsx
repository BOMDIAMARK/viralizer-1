"use client"

import { useEffect, useRef, useState } from "react"
import { useEditStore } from "@/stores/editStore"
import { ToolbarTop } from "./toolbar-top"
import { ToolbarBottom } from "./toolbar-bottom"
import { ImageSidebar } from "./image-sidebar"
import { VariationsSidebar } from "./variations-sidebar"
import { useEditor } from "@/hooks/use-editor"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, ZoomIn, ZoomOut, RotateCw, Download, Save, Undo, Redo, Trash2 } from "lucide-react"
import Image from "next/image"

interface CanvasEditorProps {
  initialImage?: string
}

export const CanvasEditor = ({ initialImage }: CanvasEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [fabricCanvas, setFabricCanvas] = useState<any>(null)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isDrawing, setIsDrawing] = useState(false)
  const [maskData, setMaskData] = useState<string | null>(null)
  const [drawingPaths, setDrawingPaths] = useState<string[]>([])
  const { toast } = useToast()

  const {
    currentImage,
    setImage,
    variations,
    isProcessing,
    generateFromText,
    editWithPrompt,
    inpaint,
    upscale,
    removeBackground,
    enhance,
    controlNet,
    realtimeEdit,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useEditor()

  const { activeTool, setActiveCanvas } = useEditStore()

  // Inicializar o canvas sem Fabric.js (usando canvas nativo)
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")

      if (ctx) {
        // Configurar canvas
        ctx.fillStyle = "#000000"
        ctx.fillRect(0, 0, canvas.width, canvas.height)

        // Criar objeto canvas personalizado
        const customCanvas = {
          element: canvas,
          context: ctx,
          width: canvas.width,
          height: canvas.height,
          clear: () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            ctx.fillStyle = "#000000"
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          },
          drawImage: (img: HTMLImageElement, x: number, y: number, width: number, height: number) => {
            ctx.drawImage(img, x, y, width, height)
          },
          toDataURL: () => canvas.toDataURL(),
        }

        setFabricCanvas(customCanvas)
        setActiveCanvas(customCanvas)
      }
    }
  }, [setActiveCanvas])

  // Carregar imagem inicial ou quando mudar
  useEffect(() => {
    const loadImage = async (url: string) => {
      if (!fabricCanvas) return

      try {
        fabricCanvas.clear()

        const img = new Image()
        img.crossOrigin = "anonymous"
        img.onload = () => {
          // Calcular escala para caber no canvas
          const scale = Math.min(fabricCanvas.width / img.width, fabricCanvas.height / img.height) * 0.9

          const scaledWidth = img.width * scale
          const scaledHeight = img.height * scale

          // Centralizar
          const x = (fabricCanvas.width - scaledWidth) / 2
          const y = (fabricCanvas.height - scaledHeight) / 2

          fabricCanvas.drawImage(img, x, y, scaledWidth, scaledHeight)
        }
        img.src = url
      } catch (error) {
        console.error("Erro ao carregar imagem:", error)
      }
    }

    if (initialImage && !currentImage) {
      setImage(initialImage)
    }

    if (currentImage) {
      loadImage(currentImage)
    }
  }, [currentImage, initialImage, setImage, fabricCanvas])

  // Configurar ferramentas de desenho
  useEffect(() => {
    if (!fabricCanvas || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = fabricCanvas.context

    // Remover listeners anteriores
    canvas.onmousedown = null
    canvas.onmousemove = null
    canvas.onmouseup = null

    if (activeTool === "brush" || activeTool === "eraser") {
      let isDrawingActive = false
      let lastX = 0
      let lastY = 0

      const startDrawing = (e: MouseEvent) => {
        isDrawingActive = true
        const rect = canvas.getBoundingClientRect()
        lastX = e.clientX - rect.left
        lastY = e.clientY - rect.top
      }

      const draw = (e: MouseEvent) => {
        if (!isDrawingActive) return

        const rect = canvas.getBoundingClientRect()
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top

        ctx.beginPath()
        ctx.moveTo(lastX, lastY)
        ctx.lineTo(currentX, currentY)

        if (activeTool === "brush") {
          ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"
          ctx.globalCompositeOperation = "source-over"
        } else {
          ctx.strokeStyle = "rgba(0, 0, 0, 1)"
          ctx.globalCompositeOperation = "destination-out"
        }

        ctx.lineWidth = 20
        ctx.lineCap = "round"
        ctx.stroke()

        lastX = currentX
        lastY = currentY
      }

      const stopDrawing = () => {
        isDrawingActive = false
      }

      canvas.onmousedown = startDrawing
      canvas.onmousemove = draw
      canvas.onmouseup = stopDrawing

      setIsDrawing(true)
    } else {
      setIsDrawing(false)
    }
  }, [activeTool, fabricCanvas])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 10, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 10, 50))
  }

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const handleGenerate = async (prompt: string) => {
    if (!prompt.trim()) return

    try {
      if ((activeTool === "brush" || activeTool === "eraser") && isDrawing && fabricCanvas) {
        // Gerar máscara a partir do desenho
        const maskDataUrl = fabricCanvas.toDataURL()
        setMaskData(maskDataUrl)

        // Usar inpainting
        await inpaint(prompt, maskDataUrl)

        // Limpar o desenho após processar
        if (currentImage) {
          setImage(currentImage)
        }
      } else if (activeTool === "magic") {
        // Usar enhance com prompt
        await enhance()
      } else if (activeTool === "realtime") {
        // Usar edição em tempo real
        await realtimeEdit(prompt)
      } else {
        // Edição normal com prompt
        await editWithPrompt(prompt)
      }
    } catch (error) {
      console.error("Erro ao gerar imagem:", error)
      toast({
        title: "Erro",
        description: "Não foi possível gerar a imagem",
        variant: "destructive",
      })
    }
  }

  const handleDownload = () => {
    if (!currentImage) return

    const link = document.createElement("a")
    link.href = currentImage
    link.download = `viralizer-edit-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleSave = async () => {
    if (!currentImage) return

    toast({
      title: "Imagem salva",
      description: "A imagem foi salva na sua biblioteca",
    })
  }

  const handleClearCanvas = () => {
    if (fabricCanvas) {
      fabricCanvas.clear()
      if (currentImage) {
        // Recarregar a imagem atual
        setImage(currentImage)
      }
    }
  }

  const handleVariationSelect = (variation: string) => {
    setImage(variation)
  }

  return (
    <div className="flex h-[85vh] bg-black text-white">
      {/* Sidebar esquerdo com imagens */}
      <ImageSidebar onSelectImage={setImage} />

      {/* Área principal de edição */}
      <div className="flex-1 flex flex-col">
        <ToolbarTop />

        <div className="flex-1 relative flex items-center justify-center overflow-hidden">
          <div
            className="relative"
            style={{
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
              transition: "transform 0.2s ease-in-out",
            }}
          >
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10 rounded-md">
                <Loader2 className="w-10 h-10 animate-spin text-coral-500" />
              </div>
            )}

            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="rounded-md border border-gray-700 cursor-crosshair"
              style={{
                cursor: isDrawing ? "crosshair" : "default",
              }}
            />
          </div>

          {/* Controles de zoom */}
          <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 p-2 rounded-md">
            <Button variant="ghost" size="icon" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-mono">{zoom}%</span>
            <Button variant="ghost" size="icon" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleRotate}>
              <RotateCw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleClearCanvas}>
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
              <Redo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDownload}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSave}>
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ToolbarBottom onGenerate={handleGenerate} />
      </div>

      {/* Sidebar direito com variações */}
      <VariationsSidebar variations={variations} onSelect={handleVariationSelect} isLoading={isProcessing} />
    </div>
  )
}

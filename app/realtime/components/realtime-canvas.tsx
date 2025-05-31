"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { useRealtimeStore } from "@/stores/realtimeStore"

interface RealtimeCanvasProps {
  onStateChange: (state: any) => void
}

export const RealtimeCanvas: React.FC<RealtimeCanvasProps> = ({ onStateChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const { activeTool, brushColor, brushSize } = useRealtimeStore()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Configurar canvas
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    const handleMouseDown = (e: MouseEvent) => {
      if (activeTool === "brush" || activeTool === "eraser") {
        setIsDrawing(true)
        const rect = canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top

        ctx.beginPath()
        ctx.moveTo(x, y)
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing) return

      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      ctx.lineWidth = brushSize
      ctx.strokeStyle = activeTool === "eraser" ? "#ffffff" : brushColor
      ctx.lineTo(x, y)
      ctx.stroke()

      // Notificar mudança de estado
      onStateChange({ tool: activeTool, color: brushColor, size: brushSize })
    }

    const handleMouseUp = () => {
      setIsDrawing(false)
      ctx.beginPath()
    }

    canvas.addEventListener("mousedown", handleMouseDown)
    canvas.addEventListener("mousemove", handleMouseMove)
    canvas.addEventListener("mouseup", handleMouseUp)

    return () => {
      canvas.removeEventListener("mousedown", handleMouseDown)
      canvas.removeEventListener("mousemove", handleMouseMove)
      canvas.removeEventListener("mouseup", handleMouseUp)
    }
  }, [activeTool, brushColor, brushSize, isDrawing, onStateChange])

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-medium">Canvas Compose</h3>
      </div>
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <canvas ref={canvasRef} width={400} height={400} className="border border-gray-300 bg-white cursor-crosshair" />
      </div>
    </div>
  )
}

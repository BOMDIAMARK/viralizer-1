"use client"

import { CanvasEditor } from "./components/canvas-editor"

export default function EditPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Editor de Imagem</h1>
      <CanvasEditor initialImage="/placeholder.svg?height=800&width=1200" />
    </div>
  )
}

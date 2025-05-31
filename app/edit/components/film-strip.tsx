"use client"

import type React from "react"
import { useEditStore } from "@/stores/editStore"
import type { ImageVersion } from "@/types/edit"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export const FilmStrip: React.FC = () => {
  const { versions, activeVersionId, setActiveVersion, addNewVersion } = useEditStore()

  const handleAddNew = async () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // Simular upload - em produção, fazer upload real para Supabase
        const mockUrl = URL.createObjectURL(file)
        addNewVersion({
          id: Date.now().toString(),
          imageUrl: mockUrl,
          createdAt: new Date().toISOString(),
          type: "upload",
        })
      }
    }
    input.click()
  }

  const handleVersionClick = (version: ImageVersion) => {
    setActiveVersion(version.id)
  }

  return (
    <div className="w-20 bg-gray-100 border-r flex flex-col items-center py-4 space-y-2">
      <Button variant="outline" size="sm" onClick={handleAddNew} className="w-16 h-16 p-0">
        <Plus className="h-6 w-6" />
      </Button>

      <div className="flex flex-col space-y-2 overflow-y-auto">
        {versions.map((version) => (
          <div
            key={version.id}
            className={`w-16 h-16 border-2 rounded cursor-pointer overflow-hidden ${
              version.id === activeVersionId ? "border-blue-500" : "border-gray-300"
            }`}
            onClick={() => handleVersionClick(version)}
          >
            <img
              src={version.imageUrl || "/placeholder.svg"}
              alt={`Version ${version.id}`}
              className="w-full h-full object-cover"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

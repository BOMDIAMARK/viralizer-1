"use client"
import { Loader2 } from "lucide-react"
import Image from "next/image"

interface VariationsSidebarProps {
  variations: string[]
  onSelect: (imageUrl: string) => void
  isLoading?: boolean
}

export const VariationsSidebar = ({ variations, onSelect, isLoading = false }: VariationsSidebarProps) => {
  return (
    <div className="w-20 bg-gray-900 border-l border-gray-800 flex flex-col items-center py-2 overflow-y-auto">
      <div className="text-xs text-gray-400 mb-2">Variações</div>

      {isLoading && (
        <div className="flex items-center justify-center h-20">
          <Loader2 className="h-5 w-5 animate-spin text-coral-500" />
        </div>
      )}

      <div className="flex flex-col gap-2 items-center">
        {variations.map((variation, index) => (
          <button
            key={index}
            className="w-16 h-16 rounded-md overflow-hidden border border-gray-700 hover:border-coral-500 transition-colors"
            onClick={() => onSelect(variation)}
          >
            <Image
              src={variation || "/placeholder.svg"}
              alt={`Variação ${index + 1}`}
              width={64}
              height={64}
              className="object-cover w-full h-full"
            />
          </button>
        ))}

        {variations.length === 0 && !isLoading && (
          <div className="text-xs text-gray-500 text-center px-2 mt-4">Gere variações usando o prompt abaixo</div>
        )}
      </div>
    </div>
  )
}

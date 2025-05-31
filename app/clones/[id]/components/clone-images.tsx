import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CloneImagesProps {
  images: string[]
}

export default function CloneImages({ images }: CloneImagesProps) {
  if (!images || images.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imagens de Treinamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {images.map((imageUrl, index) => (
            <div key={index} className="overflow-hidden rounded-md aspect-square bg-gray-100 dark:bg-gray-800">
              <img
                src={imageUrl || "/placeholder.svg"}
                alt={`Imagem de treinamento ${index + 1}`}
                className="object-cover w-full h-full"
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

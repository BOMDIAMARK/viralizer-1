"use client"

import { notFound, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getImages } from "@/app/criar/actions"
import { useAuth } from "@/hooks/use-auth"
import { ImageActions } from "./components/image-actions"
import { ImageMetadata } from "./components/image-metadata"
import { RelatedImages } from "./components/related-images"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton" // Assuming you have a Skeleton component

interface ImagePageProps {
  params: {
    id: string
  }
}

export default function ImagePage({ params }: ImagePageProps) {
  const { id: imageId } = params
  const { user, credits, isPremium } = useAuth()
  const [image, setImage] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const fetchImage = async () => {
      if (!user?.id) {
        // Redirect to login if no user, or handle loading state
        setLoading(false)
        return
      }
      setLoading(true)
      try {
        const userImages = await getImages(user.id)
        const foundImage = userImages.find((img) => img.id === imageId)
        if (foundImage) {
          setImage(foundImage)
        } else {
          notFound() // Or redirect to a 404 page
        }
      } catch (error) {
        console.error("Failed to fetch image:", error)
        notFound()
      } finally {
        setLoading(false)
      }
    }

    if (user?.id) {
      fetchImage()
    }
  }, [imageId, user?.id])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Skeleton className="w-full aspect-square rounded-lg" />
          <div className="mt-4 flex justify-center gap-2">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-10" />
          </div>
        </div>
        <div>
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-3/4 mb-4" />
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="aspect-square rounded-md" />
            <Skeleton className="aspect-square rounded-md" />
          </div>
        </div>
      </div>
    )
  }

  if (!image) {
    return notFound()
  }

  return (
    <div className="container mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <img
              src={image.url || "/placeholder.svg"}
              alt={image.prompt}
              className="w-full h-auto object-contain max-h-[70vh]"
            />
          </CardContent>
        </Card>
        <div className="mt-4 flex justify-center">
          {user && credits !== undefined && isPremium !== undefined && (
            <ImageActions
              imageId={image.id}
              imageUrl={image.url}
              prompt={image.prompt}
              style={image.style}
              negativePrompt={image.negativePrompt || undefined}
              userId={user.id}
              credits={credits}
              isPremium={isPremium}
              modelId={image.modelId || "stable-diffusion-xl"} // Pass modelId
            />
          )}
        </div>
      </div>
      <div>
        <ImageMetadata image={image} />
        <RelatedImages currentImageId={image.id} userId={user?.id} />
      </div>
    </div>
  )
}

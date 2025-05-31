import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { Sparkles } from "lucide-react"

const galleryImages = [
  {
    id: 1,
    src: "/ai-digital-art-example.png",
    alt: "Digital Art Portrait",
    className: "row-span-2",
    style: "Portrait",
  },
  {
    id: 2,
    src: "/ai-colorful-abstract.png",
    alt: "Abstract Cosmic Art",
    className: "row-span-1",
    style: "Abstract",
  },
  {
    id: 3,
    src: "/abstract-geometric-shapes.png",
    alt: "Geometric Shapes",
    className: "row-span-1",
    style: "Geometric",
  },
  {
    id: 4,
    src: "/ai-digital-art.png",
    alt: "Digital Landscape",
    className: "row-span-2",
    style: "Landscape",
  },
  {
    id: 5,
    src: "/abstract-clone.png",
    alt: "Clone Style",
    className: "row-span-1",
    style: "Clone",
  },
  {
    id: 6,
    src: "/ai-image-creator-dashboard.png",
    alt: "Dashboard UI",
    className: "row-span-1",
    style: "UI Design",
  },
  {
    id: 7,
    src: "/vibrant-social-media-thumbnail.png",
    alt: "Social Media",
    className: "row-span-1",
    style: "Social",
  },
  {
    id: 8,
    src: "/ai-digital-art-example.png",
    alt: "Character Art",
    className: "row-span-2",
    style: "Character",
  },
]

// Gerar mais imagens para preencher a galeria
const extendedGallery = [
  ...galleryImages,
  ...Array.from({ length: 20 }, (_, i) => ({
    id: galleryImages.length + i + 1,
    src: `/placeholder.svg?height=${Math.random() > 0.5 ? 400 : 300}&width=300&query=AI generated art ${i + 1}`,
    alt: `AI Generated Art ${i + 1}`,
    className: Math.random() > 0.7 ? "row-span-2" : "row-span-1",
    style: ["Realistic", "Anime", "Abstract", "Portrait", "Landscape"][Math.floor(Math.random() * 5)],
  })),
]

export default function GallerySection() {
  return (
    <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Gallery</h2>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Open Gallery
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 auto-rows-[200px]">
        {extendedGallery.map((image) => (
          <Link
            key={image.id}
            href="/estilos"
            className={`group relative overflow-hidden rounded-xl bg-card hover:scale-105 transition-all duration-300 ${image.className}`}
          >
            <img src={image.src || "/placeholder.svg"} alt={image.alt} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="text-foreground text-xs font-medium bg-background/80 dark:bg-foreground/20 rounded px-2 py-1 backdrop-blur-sm">
                {image.style}
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-12 text-center">
        <Button
          asChild
          size="lg"
          className="bg-coral hover:bg-coral-600 dark:bg-coral-500 dark:hover:bg-coral-600 text-white"
        >
          <Link href="/cadastro">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Creating
          </Link>
        </Button>
      </div>
    </div>
  )
}

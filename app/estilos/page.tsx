import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Sparkles, Crown } from "lucide-react"

const styles = [
  {
    id: "realistic",
    name: "Realista",
    description: "Imagens fotorrealistas com alta qualidade e detalhamento",
    category: "Fotografia",
    isPremium: false,
    examples: ["/realistic-portrait-example.png", "/realistic-landscape-example.png", "/realistic-product-example.png"],
  },
  {
    id: "anime",
    name: "Anime",
    description: "Estilo de animação japonesa com cores vibrantes",
    category: "Ilustração",
    isPremium: false,
    examples: ["/anime-character-example.png", "/anime-scene-example.png", "/anime-portrait-example.png"],
  },
  {
    id: "cartoon",
    name: "Cartoon",
    description: "Estilo de desenho animado colorido e divertido",
    category: "Ilustração",
    isPremium: false,
    examples: ["/cartoon-character-example.png", "/cartoon-scene-example.png", "/cartoon-mascot-example.png"],
  },
  {
    id: "oil-painting",
    name: "Pintura a Óleo",
    description: "Estilo clássico de pintura com texturas artísticas",
    category: "Arte",
    isPremium: true,
    examples: [
      "/oil-painting-portrait-example.png",
      "/oil-painting-landscape-example.png",
      "/oil-painting-still-life-example.png",
    ],
  },
  {
    id: "digital-art",
    name: "Arte Digital",
    description: "Arte conceitual moderna com elementos futuristas",
    category: "Arte",
    isPremium: false,
    examples: [
      "/digital-art-concept-example.png",
      "/digital-art-character-example.png",
      "/digital-art-environment-example.png",
    ],
  },
  {
    id: "pixel-art",
    name: "Pixel Art",
    description: "Estilo retrô de jogos 8-bit com pixels definidos",
    category: "Retrô",
    isPremium: true,
    examples: ["/pixel-art-character-example.png", "/pixel-art-scene-example.png", "/pixel-art-icon-example.png"],
  },
  {
    id: "cyberpunk",
    name: "Cyberpunk",
    description: "Estilo futurista com neon e elementos tecnológicos",
    category: "Futurista",
    isPremium: true,
    examples: ["/cyberpunk-city-example.png", "/cyberpunk-character-example.png", "/cyberpunk-tech-example.png"],
  },
  {
    id: "watercolor",
    name: "Aquarela",
    description: "Pintura em aquarela com cores suaves e fluidas",
    category: "Arte",
    isPremium: true,
    examples: [
      "/watercolor-portrait-example.png",
      "/watercolor-landscape-example.png",
      "/watercolor-flower-example.png",
    ],
  },
  {
    id: "pencil-sketch",
    name: "Desenho a Lápis",
    description: "Esboços artísticos feitos à mão com lápis",
    category: "Arte",
    isPremium: false,
    examples: [
      "/pencil-sketch-portrait-example.png",
      "/pencil-sketch-object-example.png",
      "/pencil-sketch-scene-example.png",
    ],
  },
  {
    id: "flat-design",
    name: "Design Flat",
    description: "Design minimalista e limpo com cores sólidas",
    category: "Design",
    isPremium: false,
    examples: [
      "/flat-design-icon-example.png",
      "/flat-design-illustration-example.png",
      "/flat-design-character-example.png",
    ],
  },
]

const categories = ["Todos", "Fotografia", "Ilustração", "Arte", "Retrô", "Futurista", "Design"]

export default function StylesPage() {
  return (
    <div className="container p-4 mx-auto space-y-8 sm:p-6 lg:p-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl dark:text-white">Galeria de Estilos</h1>
        <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-600 dark:text-gray-400">
          Explore nossa coleção de estilos artísticos e encontre o perfeito para suas criações
        </p>
      </div>

      {/* Filtros por categoria */}
      <div className="flex flex-wrap justify-center gap-2">
        {categories.map((category) => (
          <Button key={category} variant="outline" size="sm">
            {category}
          </Button>
        ))}
      </div>

      {/* Grid de estilos */}
      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {styles.map((style) => (
          <Card key={style.id} className="overflow-hidden transition-all hover:shadow-lg">
            <div className="relative">
              {/* Galeria de exemplos */}
              <div className="grid grid-cols-3 gap-1 aspect-[3/2]">
                {style.examples.map((example, index) => (
                  <div key={index} className="relative overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <img
                      src={`/abstract-geometric-shapes.png?height=200&width=200&query=${style.name} style example ${index + 1}`}
                      alt={`Exemplo ${index + 1} do estilo ${style.name}`}
                      className="object-cover w-full h-full"
                    />
                  </div>
                ))}
              </div>

              {/* Badges */}
              <div className="absolute top-2 left-2 flex space-x-2">
                <Badge variant="secondary">{style.category}</Badge>
                {style.isPremium && (
                  <Badge className="bg-yellow-500 text-yellow-900">
                    <Crown className="w-3 h-3 mr-1" />
                    Premium
                  </Badge>
                )}
              </div>
            </div>

            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{style.name}</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{style.description}</p>
              <div className="flex space-x-2">
                <Button asChild className="flex-1">
                  <Link href={`/criar?style=${style.id}`}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Usar Estilo
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href={`/estilos/${style.id}`}>Ver Mais</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* CTA para premium */}
      <div className="p-8 text-center bg-violet-50 rounded-lg dark:bg-violet-900/20">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Desbloqueie Todos os Estilos</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Acesse estilos premium e recursos exclusivos com uma assinatura Pro
        </p>
        <Button asChild size="lg">
          <Link href="/precos">
            <Crown className="w-4 h-4 mr-2" />
            Ver Planos Premium
          </Link>
        </Button>
      </div>
    </div>
  )
}

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Hero() {
  return (
    <div className="relative bg-white dark:bg-gray-950">
      <div className="container px-4 py-16 mx-auto sm:px-6 lg:px-8 lg:py-24">
        <div className="grid items-center grid-cols-1 gap-12 lg:grid-cols-2">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl dark:text-white">
              <span className="block">Potencialize seu</span>
              <span className="block text-coral dark:text-coral">conteúdo com IA</span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 md:text-xl dark:text-gray-400">
              Crie imagens incríveis para suas redes sociais, gere thumbnails que chamam atenção e destaque-se com o
              Viralizer - sua plataforma completa de geração de imagens com IA para creators.
            </p>
            <div className="flex flex-col mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <Button asChild size="lg" className="bg-coral hover:bg-coral-600 text-white">
                <Link href="/cadastro">Comece Grátis</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/estilos">Ver Estilos</Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="p-8 bg-white rounded-xl shadow-xl dark:bg-gray-900">
              <img
                src="/ai-image-creator-dashboard.png"
                alt="Dashboard do Viralizer"
                className="w-full rounded-lg shadow-lg"
              />
            </div>
            <div className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4">
              <img
                src="/vibrant-social-media-thumbnail.png"
                alt="Exemplo de imagem gerada"
                className="rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

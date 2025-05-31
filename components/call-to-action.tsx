import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CallToAction() {
  return (
    <div className="bg-coral dark:bg-coral-700">
      <div className="container px-4 py-16 mx-auto sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">Pronto para transformar seu conteúdo?</h2>
          <p className="mt-4 text-xl text-coral-100">
            Junte-se a milhares de creators que já estão usando o Viralizer para criar imagens incríveis para suas redes
            sociais.
          </p>
          <div className="flex flex-col justify-center mt-8 space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <Button
              asChild
              size="lg"
              variant="default"
              className="bg-white text-coral hover:bg-gray-100 hover:text-coral-700"
            >
              <Link href="/cadastro">Comece Grátis</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
              <Link href="/precos">Ver Planos</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

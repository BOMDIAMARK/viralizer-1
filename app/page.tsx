import ModernHero from "@/components/modern-hero"
import GenerateSection from "@/components/generate-section"
import GallerySection from "@/components/gallery-section"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function Home() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirecionar usuários logados para o dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernHero />
      <GenerateSection />
      <GallerySection />
    </div>
  )
}

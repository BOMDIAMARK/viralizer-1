import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import VideoGenerationForm from "./components/video-generation-form"
import VideoGallery from "./components/video-gallery"
import { Separator } from "@/components/ui/separator"
import { getUserVideos } from "./actions"

export default async function VideoPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    redirect("/login")
  }

  const videos = await getUserVideos(session.user.id)

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <header className="text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
          Gerador de Vídeo com IA
        </h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-400">
          Transforme suas ideias em vídeos incríveis com o poder da inteligência artificial.
        </p>
      </header>

      <VideoGenerationForm userId={session.user.id} />

      <Separator className="my-12" />

      <section>
        <h2 className="text-3xl font-semibold tracking-tight text-center mb-8">Seus Vídeos Gerados</h2>
        <VideoGallery videos={videos} />
      </section>
    </div>
  )
}

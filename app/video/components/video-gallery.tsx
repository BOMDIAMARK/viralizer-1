"use client"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlayCircle, Download, AlertTriangle, Loader2, Film } from "lucide-react"
import type { Database } from "@/types/supabase"

type Video = Database["public"]["Tables"]["videos"]["Row"]

interface VideoGalleryProps {
  videos: Video[]
}

export default function VideoGallery({ videos }: VideoGalleryProps) {
  if (videos.length === 0) {
    return (
      <div className="text-center py-10">
        <Film className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">Nenhum vídeo gerado ainda</h3>
        <p className="mt-1 text-sm text-muted-foreground">Comece a criar seus vídeos!</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {videos.map((video) => (
        <Card key={video.id} className="overflow-hidden flex flex-col">
          <CardHeader>
            <CardTitle className="text-base truncate" title={video.prompt}>
              {video.prompt.length > 50 ? `${video.prompt.substring(0, 50)}...` : video.prompt}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-grow flex items-center justify-center p-0 bg-muted aspect-video">
            {video.status === "succeeded" && video.video_url ? (
              video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url || "/placeholder.svg"}
                  alt={video.prompt}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                  <PlayCircle className="w-16 h-16 text-gray-400 dark:text-gray-600" />
                </div>
              )
            ) : video.status === "processing" || video.status === "starting" ? (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                Processando...
              </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-sm text-destructive">
                <AlertTriangle className="w-8 h-8 mb-2" />
                Falhou
              </div>
            )}
          </CardContent>
          <CardFooter className="p-4 grid grid-cols-2 gap-2">
            {video.status === "succeeded" && video.video_url ? (
              <>
                <Button variant="outline" size="sm" asChild>
                  <a href={video.video_url} target="_blank" rel="noopener noreferrer">
                    <PlayCircle className="w-4 h-4 mr-2" /> Ver
                  </a>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={video.video_url} download={`video_${video.id}.mp4`}>
                    <Download className="w-4 h-4 mr-2" /> Baixar
                  </a>
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" disabled className="col-span-2">
                {video.status === "processing" || video.status === "starting" ? "Processando..." : "Indisponível"}
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

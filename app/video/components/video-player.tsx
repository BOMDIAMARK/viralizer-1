"use client"

interface VideoPlayerProps {
  src: string
  prompt?: string
}

export default function VideoPlayer({ src, prompt }: VideoPlayerProps) {
  if (!src) return null

  return (
    <div className="w-full max-w-2xl mx-auto">
      <video
        controls
        src={src}
        className="w-full rounded-lg shadow-lg aspect-video"
        aria-label={prompt || "Generated video"}
      >
        Seu navegador não suporta o elemento de vídeo.
      </video>
      {prompt && <p className="mt-2 text-sm text-center text-gray-600 dark:text-gray-400">{prompt}</p>}
    </div>
  )
}

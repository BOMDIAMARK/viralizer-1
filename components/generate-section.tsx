import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Video, Zap, Sparkles, Music, FolderOpen, Crown, ArrowRight } from "lucide-react"

const generateTools = [
  {
    id: "image",
    name: "Image",
    description: "AI flux and ideogram",
    icon: ImageIcon,
    badge: "NEW",
    badgeColor: "bg-blue-500 dark:bg-blue-400",
    link: "/criar",
    available: true,
  },
  {
    id: "video",
    name: "Video",
    description: "Generate videos with Runway, Flux, Luma, and more",
    icon: Video,
    badge: null,
    link: "/video",
    available: false,
  },
  {
    id: "realtime",
    name: "Realtime",
    description: "Instant feedback on a canvas",
    icon: Zap,
    badge: null,
    link: "/realtime",
    available: false,
  },
  {
    id: "enhancer",
    name: "Enhancer",
    description: "Upscale and enhance images and videos up to 20x",
    icon: Sparkles,
    badge: "NEW",
    badgeColor: "bg-green-500 dark:bg-green-400",
    link: "/enhancer",
    available: false,
  },
  {
    id: "audio",
    name: "Audio",
    description: "Sync lips to reproduce your style, matching and more",
    icon: Music,
    badge: null,
    link: "/audio",
    available: false,
  },
  {
    id: "assets",
    name: "Assets",
    description: "Find and organize images more in flux",
    icon: FolderOpen,
    badge: null,
    link: "/assets",
    available: false,
  },
]

export default function GenerateSection() {
  return (
    <div className="px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-foreground">Generate</h2>
        <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
          Show all
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {generateTools.map((tool) => (
          <Card
            key={tool.id}
            className={`bg-card border-border hover:bg-accent transition-all duration-200 ${
              !tool.available ? "opacity-60" : "hover:border-border/80"
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-muted rounded-lg">
                    <tool.icon className="w-5 h-5 text-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{tool.name}</h3>
                    {tool.badge && (
                      <Badge variant="secondary" className={`${tool.badgeColor} text-white text-xs mt-1`}>
                        {tool.badge}
                      </Badge>
                    )}
                  </div>
                </div>

                {tool.available ? (
                  <Button asChild size="sm" variant="outline" className="border-border text-foreground hover:bg-accent">
                    <Link href={tool.link}>Open</Link>
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" disabled className="border-border text-muted-foreground">
                    Soon
                  </Button>
                )}
              </div>

              <p className="text-sm text-muted-foreground">{tool.description}</p>

              {!tool.available && (
                <div className="flex items-center mt-3 text-xs text-amber-500 dark:text-amber-400">
                  <Crown className="w-3 h-3 mr-1" />
                  Coming Soon
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ChevronLeft, ChevronRight, Sparkles, Zap } from "lucide-react"

const heroSlides = [
  {
    id: 1,
    badge: "NEW FEATURE",
    title: "Announcing Flux Pro",
    description:
      "Generate ultra-high quality images with our latest AI model. Professional results with enhanced detail and accuracy.",
    buttonText: "Try Flux Pro",
    buttonLink: "/criar?style=realistic",
    background:
      "bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-700 dark:from-violet-500 dark:via-blue-500 dark:to-indigo-600",
    icon: <Sparkles className="w-8 h-8" />,
  },
  {
    id: 2,
    badge: "ENHANCED",
    title: "New Clone Models",
    description:
      "Train AI models with your unique style. Create personalized content that matches your brand identity perfectly.",
    buttonText: "Upgrade & Enhance",
    buttonLink: "/clones/criar",
    background:
      "bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 dark:from-orange-400 dark:via-red-400 dark:to-pink-500",
    icon: <Zap className="w-8 h-8" />,
  },
]

export default function ModernHero() {
  const [currentSlide, setCurrentSlide] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % heroSlides.length)
  }

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length)
  }

  return (
    <div className="relative px-4 py-16 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Main Feature Card */}
        <div className="relative overflow-hidden rounded-2xl">
          <div
            className={`${heroSlides[currentSlide].background} p-8 h-80 flex flex-col justify-between text-white dark:text-gray-100 relative`}
          >
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <div className="flex items-center justify-center w-full h-full">
                {/* Audio waveform visualization */}
                <div className="flex items-end space-x-1">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-white dark:bg-gray-200 rounded-full animate-pulse"
                      style={{
                        width: "3px",
                        height: `${Math.random() * 40 + 10}px`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="relative z-10">
              <Badge
                variant="secondary"
                className="mb-4 bg-white/20 dark:bg-gray-800/30 text-white dark:text-gray-100 border-white/30 dark:border-gray-600/30"
              >
                {heroSlides[currentSlide].badge}
              </Badge>
              <h2 className="text-3xl font-bold mb-4">{heroSlides[currentSlide].title}</h2>
              <p className="text-white/90 dark:text-gray-200/90 mb-6 max-w-md">
                {heroSlides[currentSlide].description}
              </p>
            </div>

            <div className="relative z-10">
              <Button
                asChild
                variant="secondary"
                className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Link href={heroSlides[currentSlide].buttonLink}>{heroSlides[currentSlide].buttonText}</Link>
              </Button>
            </div>

            <div className="absolute top-6 right-6">{heroSlides[currentSlide].icon}</div>
          </div>
        </div>

        {/* Secondary Feature Card */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-muted to-muted/50 dark:from-gray-800 dark:to-gray-900">
          <div className="absolute inset-0">
            <img
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/home.png-7Hm027AwYs8nNr0gtNTVqt4GA4Mm3f.jpeg"
              alt="AI Generated Lion"
              className="w-full h-full object-cover opacity-60 dark:opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent dark:from-gray-900 dark:via-gray-900/50" />
          </div>

          <div className="relative z-10 p-8 h-80 flex flex-col justify-between text-foreground">
            <div>
              <Badge
                variant="secondary"
                className="mb-4 bg-green-500/20 dark:bg-green-400/20 text-green-700 dark:text-green-300 border-green-500/30 dark:border-green-400/30"
              >
                NEW
              </Badge>
              <h3 className="text-2xl font-bold mb-4">Enhanced Models</h3>
              <p className="text-muted-foreground mb-6">
                Experience next-level image generation with our enhanced AI models. Better quality, faster processing.
              </p>
            </div>

            <Button asChild variant="outline" className="border-border text-foreground hover:bg-accent">
              <Link href="/estilos">Explore Styles</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between mt-8">
        <div className="flex space-x-2">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide ? "bg-foreground w-8" : "bg-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={prevSlide} className="text-foreground hover:bg-accent">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={nextSlide} className="text-foreground hover:bg-accent">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { createClientClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ViralizerMenu } from "@/components/viralizer-menu"

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isPremium, setIsPremium] = useState(false)
  const router = useRouter()
  const supabase = createClientClient()

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setIsLoggedIn(!!session)

      if (session) {
        // Check if user is premium
        const { data: userData } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", session.user.id)
          .single()

        setIsPremium(userData?.is_premium || false)
      }
    }

    checkAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_, session) => {
      setIsLoggedIn(!!session)

      if (session) {
        const { data: userData } = await supabase
          .from("profiles")
          .select("is_premium")
          .eq("id", session.user.id)
          .single()

        setIsPremium(userData?.is_premium || false)
      } else {
        setIsPremium(false)
      }
    })

    return () => {
      authListener.subscription.unsubscribe()
    }
  }, [supabase.auth])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  return (
    <header className="bg-background/80 backdrop-blur-lg border-b border-border/40 sticky top-0 z-50">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img src="/simbolo-light.svg" alt="Viralizer" className="w-8 h-8 dark:hidden" />
              <img src="/logo-extra-dark.svg" alt="Viralizer" className="w-8 h-8 hidden dark:block" />
              <span className="text-xl font-bold text-foreground">Viralizer</span>
            </Link>
          </div>

          {/* Desktop Navigation Menu */}
          <div className="hidden md:flex items-center justify-center flex-1 px-8">
            <ViralizerMenu isAuthenticated={isLoggedIn} isPremium={isPremium} />
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <div className="hidden md:flex md:items-center md:space-x-4">
              {isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    className="text-foreground hover:bg-accent"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleLogout}
                    className="border-border text-foreground hover:bg-accent"
                  >
                    Sair
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/login")}
                    className="text-foreground hover:bg-accent"
                  >
                    Entrar
                  </Button>
                  <Button onClick={() => router.push("/cadastro")} className="bg-coral hover:bg-coral-600 text-white">
                    Cadastrar
                  </Button>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="inline-flex items-center justify-center p-2 text-muted-foreground rounded-md hover:text-foreground hover:bg-accent"
              >
                <span className="sr-only">Abrir menu</span>
                {isOpen ? (
                  <X className="w-6 h-6" aria-hidden="true" />
                ) : (
                  <Menu className="w-6 h-6" aria-hidden="true" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t border-border/40">
          <div className="px-4 py-6 space-y-4">
            {/* Mobile Navigation Menu */}
            <div className="flex justify-center mb-6">
              <ViralizerMenu isAuthenticated={isLoggedIn} isPremium={isPremium} />
            </div>

            <div className="pt-4 border-t border-border/40">
              <div className="space-y-2">
                {isLoggedIn ? (
                  <>
                    <button
                      onClick={() => {
                        router.push("/dashboard")
                        setIsOpen(false)
                      }}
                      className="block w-full px-3 py-2 text-base font-medium text-left text-foreground rounded-md hover:bg-accent"
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsOpen(false)
                      }}
                      className="block w-full px-3 py-2 text-base font-medium text-left text-foreground rounded-md hover:bg-accent"
                    >
                      Sair
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        router.push("/login")
                        setIsOpen(false)
                      }}
                      className="block w-full px-3 py-2 text-base font-medium text-left text-foreground rounded-md hover:bg-accent"
                    >
                      Entrar
                    </button>
                    <button
                      onClick={() => {
                        router.push("/cadastro")
                        setIsOpen(false)
                      }}
                      className="block w-full px-3 py-2 text-base font-medium text-left text-foreground rounded-md hover:bg-accent"
                    >
                      Cadastrar
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}

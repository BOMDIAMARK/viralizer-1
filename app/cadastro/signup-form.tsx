"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { createClientClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/use-toast"
import { AlertCircle } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"

export default function SignupForm() {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClientClient()

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!acceptTerms) {
      setError("Você precisa aceitar os termos de uso para continuar.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // Registrar usuário com Supabase
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        toast({
          title: "Erro ao criar conta",
          description: signUpError.message,
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Conta criada com sucesso",
        description: "Verifique seu email para confirmar sua conta.",
      })

      // Redirecionar para página de confirmação
      router.push("/cadastro/confirmacao")
    } catch (err) {
      console.error("Erro no cadastro:", err)
      setError("Ocorreu um erro inesperado ao tentar criar sua conta.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <form onSubmit={handleSignup}>
        <CardHeader>
          {error && (
            <div className="flex items-center p-3 mb-4 space-x-2 text-sm text-red-600 border border-red-200 rounded-md bg-red-50 dark:text-red-400 dark:border-red-900 dark:bg-red-950/50">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              placeholder="Seu nome completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              placeholder="Crie uma senha forte"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">A senha deve ter pelo menos 8 caracteres</p>
          </div>
          <div className="flex items-start space-x-2">
            <Checkbox
              id="terms"
              checked={acceptTerms}
              onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm font-normal text-gray-600 dark:text-gray-400">
              Eu concordo com os{" "}
              <Link
                href="/termos"
                className="font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Termos de Uso
              </Link>{" "}
              e{" "}
              <Link
                href="/privacidade"
                className="font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
              >
                Política de Privacidade
              </Link>
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Criando conta..." : "Criar conta"}
          </Button>
          <div className="text-sm text-center text-gray-600 dark:text-gray-400">
            Já tem uma conta?{" "}
            <Link
              href="/login"
              className="font-medium text-violet-600 hover:text-violet-800 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Faça login
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

import LoginForm from "./login-form"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function LoginPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Redirecionar usuários logados para o dashboard
  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Entrar no Viralizer</h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Acesse sua conta para começar a criar imagens incríveis
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

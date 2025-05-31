import Link from "next/link"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"

export default function ConfirmationPage() {
  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50 dark:bg-gray-900 sm:px-6 lg:px-8">
      <div className="w-full max-w-md p-8 space-y-6 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center justify-center w-16 h-16 mx-auto bg-green-100 rounded-full dark:bg-green-900">
          <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadastro realizado com sucesso!</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Enviamos um email de confirmação para o endereço fornecido. Por favor, verifique sua caixa de entrada e clique
          no link de confirmação para ativar sua conta.
        </p>
        <div className="pt-4 mt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
            Não recebeu o email? Verifique sua pasta de spam ou solicite um novo email de confirmação.
          </p>
          <div className="space-y-3">
            <Button variant="outline" className="w-full">
              Reenviar email de confirmação
            </Button>
            <Button asChild variant="link" className="w-full">
              <Link href="/login">Voltar para o login</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

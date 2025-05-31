import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Crown } from "lucide-react"
import Link from "next/link"

export default function CloneExplainer() {
  return (
    <Alert className="bg-violet-50 border-violet-200 dark:bg-violet-900/20 dark:border-violet-800">
      <Crown className="w-4 h-4 text-violet-600 dark:text-violet-400" />
      <AlertTitle className="text-violet-800 dark:text-violet-300">Recurso Premium</AlertTitle>
      <AlertDescription className="text-violet-700 dark:text-violet-400">
        <p className="mb-2">
          Clones são modelos de IA personalizados treinados com suas próprias imagens para gerar conteúdo no seu estilo
          único. Este recurso está disponível apenas para usuários premium.
        </p>
        <Button asChild size="sm" className="mt-2">
          <Link href="/precos">Fazer Upgrade</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}

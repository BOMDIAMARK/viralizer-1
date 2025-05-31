import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Edit, Trash2, AlertTriangle, CheckCircle2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface Clone {
  id: string
  name: string
  description: string | null
  status: "pending" | "training" | "ready" | "failed"
  created_at: string
  updated_at: string
  sample_image_url: string | null
  model_id: string | null
}

interface ClonesListProps {
  clones: Clone[]
  isPremium: boolean
}

export default function ClonesList({ clones, isPremium }: ClonesListProps) {
  if (!isPremium && clones.length === 0) {
    return null
  }

  if (clones.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-lg shadow-md dark:bg-gray-800">
        <p className="text-gray-600 dark:text-gray-400">
          Você ainda não criou nenhum clone.
          <Link href="/clones/criar" className="ml-1 text-violet-600 dark:text-violet-400 hover:underline">
            Criar meu primeiro clone
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {clones.map((clone) => (
        <Card key={clone.id} className="overflow-hidden">
          <div className="relative aspect-square">
            <img
              src={clone.sample_image_url || `/placeholder.svg?height=300&width=300&query=AI style ${clone.name}`}
              alt={`Clone ${clone.name}`}
              className="object-cover w-full h-full"
            />
            <div className="absolute top-2 right-2">
              <StatusBadge status={clone.status} />
            </div>
          </div>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{clone.name}</span>
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {clone.description || "Nenhuma descrição fornecida"}
            </p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 mr-1" />
              Criado{" "}
              {formatDistanceToNow(new Date(clone.created_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" size="sm" asChild>
              <Link href={`/clones/${clone.id}`}>
                <Edit className="w-4 h-4 mr-2" />
                Detalhes
              </Link>
            </Button>
            <Button variant="destructive" size="sm">
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge
          variant="outline"
          className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
        >
          Pendente
        </Badge>
      )
    case "training":
      return (
        <Badge
          variant="outline"
          className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"
        >
          Treinando
        </Badge>
      )
    case "ready":
      return (
        <Badge
          variant="outline"
          className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800"
        >
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Pronto
        </Badge>
      )
    case "failed":
      return (
        <Badge
          variant="outline"
          className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800"
        >
          <AlertTriangle className="w-3 h-3 mr-1" />
          Falhou
        </Badge>
      )
    default:
      return null
  }
}

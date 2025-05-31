import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "/mês",
    description: "Perfeito para começar",
    features: ["10 créditos por mês", "Acesso a estilos básicos", "Resolução padrão", "Suporte por email"],
    buttonText: "Começar Grátis",
    buttonVariant: "outline" as const,
    popular: false,
  },
  {
    name: "Pro",
    price: "R$ 29",
    period: "/mês",
    description: "Para creators profissionais",
    features: [
      "500 créditos por mês",
      "Todos os estilos disponíveis",
      "Alta resolução",
      "Criação de clones personalizados",
      "Suporte prioritário",
      "API de acesso",
    ],
    buttonText: "Assinar Pro",
    buttonVariant: "default" as const,
    popular: true,
  },
  {
    name: "Enterprise",
    price: "R$ 99",
    period: "/mês",
    description: "Para equipes e empresas",
    features: [
      "2000 créditos por mês",
      "Todos os recursos Pro",
      "Clones ilimitados",
      "Integração personalizada",
      "Suporte dedicado",
      "SLA garantido",
    ],
    buttonText: "Falar com Vendas",
    buttonVariant: "outline" as const,
    popular: false,
  },
]

export default function PrecosPage() {
  return (
    <div className="container px-4 py-16 mx-auto sm:px-6 lg:px-8">
      <div className="text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl dark:text-white">Planos e Preços</h1>
        <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-600 dark:text-gray-400">
          Escolha o plano ideal para suas necessidades de criação de conteúdo
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 mt-12 md:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.name} className={`relative ${plan.popular ? "border-violet-500 shadow-lg" : ""}`}>
            {plan.popular && (
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="bg-violet-500 text-white px-3 py-1 text-sm font-medium rounded-full">
                  Mais Popular
                </span>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
              <div className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">{plan.price}</span>
                <span className="text-gray-600 dark:text-gray-400">{plan.period}</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-3" />
                    <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button asChild variant={plan.buttonVariant} className="w-full">
                <Link href="/cadastro">{plan.buttonText}</Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="mt-16 text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Perguntas Frequentes</h2>
        <div className="max-w-3xl mx-auto mt-8 space-y-6">
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">O que são créditos?</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Cada crédito permite gerar uma imagem com IA. Os créditos são renovados mensalmente de acordo com seu
              plano.
            </p>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Posso cancelar a qualquer momento?</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Sim, você pode cancelar sua assinatura a qualquer momento. Seus créditos restantes continuarão válidos até
              o final do período.
            </p>
          </div>
          <div className="text-left">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Os créditos expiram?</h3>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Os créditos não utilizados expiram no final de cada mês. Recomendamos usar todos os seus créditos mensais.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

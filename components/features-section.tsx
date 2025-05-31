import { Sparkles, Brush, Repeat, CreditCard, Cloud, Shield } from "lucide-react"

const features = [
  {
    name: "Geração de Imagens com IA",
    description: "Crie imagens incríveis com diferentes estilos usando IA de ponta em segundos.",
    icon: Sparkles,
  },
  {
    name: "Diversos Estilos",
    description: "Escolha entre dezenas de estilos artísticos para personalizar suas criações.",
    icon: Brush,
  },
  {
    name: "Clones Personalizados",
    description: "Treine modelos com seu estilo único para gerar imagens com sua identidade visual.",
    icon: Repeat,
  },
  {
    name: "Sistema de Créditos",
    description: "Planos flexíveis com créditos para usar conforme sua necessidade.",
    icon: CreditCard,
  },
  {
    name: "Armazenamento em Nuvem",
    description: "Acesse suas imagens de qualquer lugar e organize sua biblioteca de criações.",
    icon: Cloud,
  },
  {
    name: "Conteúdo Seguro",
    description: "Filtros inteligentes que garantem a geração de conteúdo apropriado.",
    icon: Shield,
  },
]

export default function FeaturesSection() {
  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="container px-4 mx-auto sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl dark:text-white">
            Recursos Poderosos para Creators
          </h2>
          <p className="max-w-2xl mx-auto mt-4 text-xl text-gray-600 dark:text-gray-400">
            Tudo o que você precisa para criar conteúdo visual impressionante com IA.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 mt-12 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.name}
              className="relative p-6 bg-white rounded-lg shadow-md transition-all hover:shadow-lg dark:bg-gray-800"
            >
              <div>
                <span className="inline-flex items-center justify-center p-3 text-white bg-coral rounded-md dark:bg-coral-600">
                  <feature.icon className="w-6 h-6" aria-hidden="true" />
                </span>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{feature.name}</h3>
              <p className="mt-2 text-base text-gray-600 dark:text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

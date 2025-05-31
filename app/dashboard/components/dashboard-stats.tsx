import { CreditCard, ImageIcon, Crown } from "lucide-react"

interface DashboardStatsProps {
  credits: number
  subscription: string
  imagesCount: number
}

export default function DashboardStats({ credits, subscription, imagesCount }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center">
          <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-400 dark:bg-orange-900/20">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Créditos Disponíveis</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{credits}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center">
          <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-400 dark:bg-blue-900/20">
            <ImageIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Imagens Criadas</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white">{imagesCount}</p>
          </div>
        </div>
      </div>

      <div className="p-6 bg-white rounded-lg shadow-md dark:bg-gray-800">
        <div className="flex items-center">
          <div className="p-3 mr-4 text-purple-500 bg-purple-100 rounded-full dark:text-purple-400 dark:bg-purple-900/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plano Atual</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-white capitalize">
              {subscription === "free" ? "Gratuito" : subscription}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

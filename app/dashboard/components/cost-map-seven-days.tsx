"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, TrendingUp, ImageIcon, BarChart3 } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"
import { format, parseISO } from "date-fns"
import { ptBR } from "date-fns/locale"

interface CostData {
  period: { start: string; end: string }
  summary: {
    totalUSD: number
    totalBRL: number
    totalImages: number
    avgCostPerImageUSD: number
    avgCostPerImageBRL: number
  }
  daily: Array<{
    date: string
    totalUSD: number
    totalBRL: number
    count: number
  }>
  byModel: Array<{
    id: string
    name: string
    count: number
    costUSD: number
    costBRL: number
  }>
}

const COLORS = ["#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981", "#6366f1"]

function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

function formatUSD(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD" })
}

export default function CostMapSevenDays() {
  const [data, setData] = useState<CostData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCosts() {
      try {
        const res = await fetch("/api/costs")
        if (!res.ok) throw new Error("Erro ao carregar custos")
        const json = await res.json()
        setData(json)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido")
      } finally {
        setLoading(false)
      }
    }
    fetchCosts()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Mapa de Custos - Últimos 7 Dias</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded dark:bg-gray-700" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-gray-500">
          {error || "Nenhum dado disponível"}
        </CardContent>
      </Card>
    )
  }

  const chartData = data.daily.map((day) => ({
    ...day,
    label: format(parseISO(day.date), "dd/MM", { locale: ptBR }),
    dayName: format(parseISO(day.date), "EEE", { locale: ptBR }),
  }))

  const pieData = data.byModel.map((model) => ({
    name: model.name,
    value: model.costBRL,
    count: model.count,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Mapa de Custos - Últimos 7 Dias
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(parseISO(data.period.start), "dd/MM/yyyy")} - {format(parseISO(data.period.end), "dd/MM/yyyy")}
        </span>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full dark:text-green-400 dark:bg-green-900/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Total (BRL)</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatBRL(data.summary.totalBRL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full dark:text-blue-400 dark:bg-blue-900/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Total (USD)</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatUSD(data.summary.totalUSD)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-purple-500 bg-purple-100 rounded-full dark:text-purple-400 dark:bg-purple-900/20">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Imagens</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {data.summary.totalImages}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-3 mr-4 text-orange-500 bg-orange-100 rounded-full dark:text-orange-400 dark:bg-orange-900/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Custo Médio/Imagem</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {formatBRL(data.summary.avgCostPerImageBRL)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gráfico de barras - Custos diários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <BarChart3 className="w-5 h-5" />
              Custos Diários (BRL)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 12 }}
                  className="text-gray-600 dark:text-gray-400"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `R$${value.toFixed(2)}`}
                  className="text-gray-600 dark:text-gray-400"
                />
                <Tooltip
                  formatter={(value: number) => [formatBRL(value), "Custo"]}
                  labelFormatter={(label) => `Data: ${label}`}
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="totalBRL" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Custo (BRL)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de pizza - Custos por modelo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="w-5 h-5" />
              Custos por Modelo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) =>
                      `${name} (${(percent * 100).toFixed(0)}%)`
                    }
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [formatBRL(value), name]}
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-500">
                Nenhuma imagem gerada nos últimos 7 dias
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabela detalhada por modelo */}
      {data.byModel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhamento por Modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Modelo</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Imagens</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Custo (USD)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">Custo (BRL)</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600 dark:text-gray-400">% do Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.byModel.map((model, index) => (
                    <tr key={model.id} className="border-b dark:border-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium text-gray-900 dark:text-white">{model.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{model.count}</td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatUSD(model.costUSD)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {formatBRL(model.costBRL)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                        {data.summary.totalBRL > 0
                          ? ((model.costBRL / data.summary.totalBRL) * 100).toFixed(1)
                          : 0}
                        %
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold border-t-2 dark:border-gray-600">
                    <td className="px-4 py-3 text-gray-900 dark:text-white">Total</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {data.summary.totalImages}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatUSD(data.summary.totalUSD)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                      {formatBRL(data.summary.totalBRL)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">100%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

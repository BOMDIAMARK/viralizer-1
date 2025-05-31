"use client"

import type React from "react"

import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"
import { useState } from "react"

interface ImageFiltersProps {
  availableStyles: string[]
}

export default function ImageFilters({ availableStyles }: ImageFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [style, setStyle] = useState(searchParams.get("style") || "all")
  const [sort, setSort] = useState(searchParams.get("sort") || "newest")

  const updateFilters = (newFilters: { search?: string; style?: string; sort?: string }) => {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    })

    router.push(`/minhas-imagens?${params.toString()}`)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters({ search, style, sort })
  }

  const clearFilters = () => {
    setSearch("")
    setStyle("all")
    setSort("newest")
    router.push("/minhas-imagens")
  }

  const hasActiveFilters = search || style !== "all" || sort !== "newest"

  return (
    <div className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-end">
        {/* Busca por prompt */}
        <div className="flex-1">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar por prompt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </form>
        </div>

        {/* Filtro por estilo */}
        <div className="w-full md:w-48">
          <Select
            value={style}
            onValueChange={(value) => {
              setStyle(value)
              updateFilters({ search, style: value, sort })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estilos</SelectItem>
              {availableStyles.map((styleOption) => (
                <SelectItem key={styleOption} value={styleOption}>
                  {styleOption}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ordenação */}
        <div className="w-full md:w-48">
          <Select
            value={sort}
            onValueChange={(value) => {
              setSort(value)
              updateFilters({ search, style, sort: value })
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Mais recentes</SelectItem>
              <SelectItem value="oldest">Mais antigas</SelectItem>
              <SelectItem value="prompt">Por prompt (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Botões de ação */}
        <div className="flex space-x-2">
          <Button type="submit" onClick={handleSearchSubmit}>
            <Filter className="w-4 h-4 mr-2" />
            Filtrar
          </Button>
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Limpar
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

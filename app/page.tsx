"use client"

import { useState, useEffect } from "react"
import GoogleMap from "@/components/google-map"
import MessageModal from "@/components/message-modal"
import type { HealthUnit } from "@/types"

export default function HomePage() {
  const [category, setCategory] = useState("")
  const [municipio, setMunicipio] = useState("todos")
  const [municipios, setMunicipios] = useState<string[]>([])
  const [healthUnits, setHealthUnits] = useState<Record<string, HealthUnit[]>>({})
  const [loading, setLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState<string>("")
  const [showModal, setShowModal] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<{
    place_id: string
    name: string
    formatted_address: string
  } | null>(null)
  const [totalResults, setTotalResults] = useState(0)

  const showMessageModal = (message: string) => {
    setModalMessage(message)
    setShowModal(true)
  }

  const populateMunicipios = async () => {
    try {
      const res = await fetch("/api/municipios")
      const municipiosData = await res.json()
      setMunicipios(municipiosData.sort())
    } catch (e) {
      console.error("Erro ao carregar municípios:", e)
      showMessageModal("Erro ao carregar lista de municípios.")
    }
  }

  const fetchHealthUnits = async () => {
    if (!category) {
      setHealthUnits({})
      setTotalResults(0)
      return
    }

    setLoading(true)
    try {
      const url = `/api/health-units?category=${encodeURIComponent(category)}&municipio=${encodeURIComponent(municipio)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const dataByMunicipality = await res.json()

      setHealthUnits(dataByMunicipality)

      // Calcula o total de resultados
      const total = Object.values(dataByMunicipality).reduce((sum: number, units: any) => {
        return sum + (Array.isArray(units) ? units.length : 0)
      }, 0)
      setTotalResults(total)

      if (total > 0) {
        showMessageModal(`Encontradas ${total} unidades de saúde!`)
      }
    } catch (e) {
      console.error("Erro ao buscar unidades:", e)
      showMessageModal("Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.")
      setHealthUnits({})
      setTotalResults(0)
    } finally {
      setLoading(false)
    }
  }

  const handleTraceRoute = (unit: HealthUnit) => {
    setSelectedDestination({
      place_id: unit.id,
      name: unit.displayName?.text || "Nome não disponível",
      formatted_address: unit.formattedAddress || "Não informado",
    })
  }

  useEffect(() => {
    populateMunicipios()
  }, [])

  useEffect(() => {
    fetchHealthUnits()
  }, [category, municipio])

  const renderResults = () => {
    if (loading) {
      return (
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-blue-600">Buscando todas as unidades disponíveis...</p>
          <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
        </div>
      )
    }

    if (!category) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Selecione uma categoria para começar a busca.</p>
        </div>
      )
    }

    if (Object.keys(healthUnits).length === 0) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-600">Nenhuma unidade encontrada para os critérios selecionados.</p>
        </div>
      )
    }

    return (
      <div>
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 font-medium">
            📊 Total de {totalResults} unidade{totalResults !== 1 ? "s" : ""} encontrada{totalResults !== 1 ? "s" : ""}
          </p>
        </div>

        {Object.keys(healthUnits)
          .sort()
          .map((municipioName) => (
            <div key={municipioName}>
              <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-3 border-b pb-2">
                📍 {municipioName} ({healthUnits[municipioName].length} unidade
                {healthUnits[municipioName].length !== 1 ? "s" : ""})
              </h2>
              <div className="grid gap-4">
                {healthUnits[municipioName].map((unit, index) => (
                  <div
                    key={`${unit.id}-${index}`}
                    className="bg-white p-6 border rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:border-blue-300"
                  >
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {unit.displayName?.text || "Nome não disponível"}
                    </h3>
                    <div className="space-y-1 mb-4">
                      <p className="text-gray-600 flex items-start">
                        <span className="font-medium mr-2">📍</span>
                        {unit.formattedAddress || "Endereço não informado"}
                      </p>
                      <p className="text-gray-600 flex items-center">
                        <span className="font-medium mr-2">📞</span>
                        {unit.nationalPhoneNumber || "Telefone não informado"}
                      </p>
                    </div>
                    <button
                      onClick={() => handleTraceRoute(unit)}
                      className="w-full sm:w-auto px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium"
                    >
                      🗺️ Traçar Rota
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">🏥 Encontre Unidades de Saúde</h1>
          <p className="text-gray-600">Localize unidades de saúde no Maranhão e trace rotas</p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-lg mb-8">
          {/* Controles de Busca */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">🔍 Filtros de Busca</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="category-select" className="block text-gray-700 text-sm font-bold mb-2">
                  Categoria:
                </label>
                <select
                  id="category-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Clínica Geral">🏥 Clínica Geral</option>
                  <option value="Hospital">🏨 Hospital</option>
                  <option value="Farmácia">💊 Farmácia</option>
                  <option value="Posto de Saúde">🏥 Posto de Saúde</option>
                  <option value="Laboratório">🔬 Laboratório</option>
                </select>
              </div>
              <div>
                <label htmlFor="municipio-select" className="block text-gray-700 text-sm font-bold mb-2">
                  Município:
                </label>
                <select
                  id="municipio-select"
                  value={municipio}
                  onChange={(e) => setMunicipio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="todos">📍 Todos os Municípios</option>
                  {municipios.map((m) => (
                    <option key={m} value={m}>
                      📍 {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchHealthUnits}
                  disabled={!category || loading}
                  className="w-full p-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {loading ? "🔄 Buscando..." : "🔍 Buscar Todas"}
                </button>
              </div>
            </div>
          </div>

          {/* Resultados da Busca */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 mb-4">📋 Resultados</h2>
            {renderResults()}
          </div>

          {/* Seção do Mapa */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 mb-4">🗺️ Mapa e Rotas</h2>
            <GoogleMap
              destination={selectedDestination}
              onRouteCleared={() => setSelectedDestination(null)}
              showMessage={showMessageModal}
            />
          </div>
        </div>

        <MessageModal message={modalMessage} isOpen={showModal} onClose={() => setShowModal(false)} />
      </div>
    </div>
  )
}

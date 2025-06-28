"use client"

import { useState, useEffect } from "react"
import GoogleMap from "@/components/google-map"
import type { User, HealthUnit } from "@/types"

interface MainAppProps {
  user: User
  authToken: string | null
  onLogout: () => void
  showMessage: (message: string) => void
}

export default function MainApp({ user, authToken, onLogout, showMessage }: MainAppProps) {
  const [category, setCategory] = useState("")
  const [municipio, setMunicipio] = useState("todos")
  const [municipios, setMunicipios] = useState<string[]>([])
  const [healthUnits, setHealthUnits] = useState<Record<string, HealthUnit[]>>({})
  const [loading, setLoading] = useState(false)
  const [selectedDestination, setSelectedDestination] = useState<{
    place_id: string
    name: string
    formatted_address: string
  } | null>(null)

  const populateMunicipios = async () => {
    try {
      const res = await fetch("/api/municipios")
      const municipiosData = await res.json()
      setMunicipios(municipiosData.sort())
    } catch (e) {
      console.error("Erro ao carregar municípios:", e)
      showMessage("Erro ao carregar lista de municípios.")
    }
  }

  const fetchHealthUnits = async () => {
    if (!category) {
      setHealthUnits({})
      return
    }

    setLoading(true)
    try {
      const url = `/api/health-units?category=${encodeURIComponent(category)}&municipio=${encodeURIComponent(municipio)}`
      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`)
      const dataByMunicipality = await res.json()
      setHealthUnits(dataByMunicipality)
    } catch (e) {
      console.error("Erro ao buscar unidades:", e)
      showMessage("Ocorreu um erro ao buscar os dados. Tente novamente mais tarde.")
      setHealthUnits({})
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      // Call logout endpoint if it exists
      await fetch("/api/auth/logout", { method: "POST" })
    } catch (e) {
      console.warn("Erro no endpoint logout (ignorado):", e)
    } finally {
      onLogout()
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
      return <p className="text-center p-4 text-blue-600">A procurar unidades de saúde...</p>
    }

    if (!category) {
      return <p className="text-center p-4 text-gray-600">Selecione uma categoria para começar a busca.</p>
    }

    if (Object.keys(healthUnits).length === 0) {
      return <p className="text-center p-4 text-gray-600">Nenhuma unidade encontrada para os critérios selecionados.</p>
    }

    return (
      <div>
        {Object.keys(healthUnits)
          .sort()
          .map((municipioName) => (
            <div key={municipioName}>
              <h2 className="text-xl font-semibold text-gray-700 mt-6 mb-3">{municipioName}</h2>
              {healthUnits[municipioName].map((unit) => (
                <div
                  key={unit.id}
                  className="bg-white p-4 mb-3 border rounded-lg cursor-pointer hover:bg-blue-50 transition-all hover:shadow-md"
                >
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    {unit.displayName?.text || "Nome não disponível"}
                  </h3>
                  <p className="text-gray-600 mb-1">
                    <strong>Endereço:</strong> {unit.formattedAddress || "Não informado"}
                  </p>
                  <p className="text-gray-600 mb-2">
                    <strong>Telefone:</strong> {unit.nationalPhoneNumber || "Não informado"}
                  </p>
                  <button
                    onClick={() => handleTraceRoute(unit)}
                    className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                  >
                    Traçar Rota
                  </button>
                </div>
              ))}
            </div>
          ))}
      </div>
    )
  }

  return (
    <section className="bg-white p-8 rounded-xl shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-700">
          Bem-vindo, <span className="text-blue-600">{user.username || user.email}</span>!
        </h2>
        <button
          onClick={handleLogout}
          className="bg-red-500 text-white p-2 rounded-lg font-semibold hover:bg-red-600 transition-colors"
        >
          Logout
        </button>
      </div>

      {/* Controles de Busca */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="category-select" className="block text-gray-700 text-sm font-bold mb-2">
            Categoria:
          </label>
          <select
            id="category-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="">Selecione uma categoria</option>
            <option value="Clínica Geral">Clínica Geral</option>
            <option value="Hospital">Hospital</option>
            <option value="Farmácia">Farmácia</option>
            <option value="Posto de Saúde">Posto de Saúde</option>
            <option value="Laboratório">Laboratório</option>
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
            className="shadow border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          >
            <option value="todos">Todos os Municípios</option>
            {municipios.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div>
          <button
            onClick={fetchHealthUnits}
            className="mt-7 w-full bg-green-600 text-white p-2 rounded-lg font-semibold hover:bg-green-700 transition-colors"
          >
            Buscar Unidades
          </button>
        </div>
      </div>

      {/* Resultados da Busca */}
      <div className="mb-8">{renderResults()}</div>

      {/* Seção do Mapa */}
      <div>
        <h3 className="text-xl font-medium text-gray-600 mb-4">Mapa e Rotas</h3>
        <GoogleMap
          destination={selectedDestination}
          onRouteCleared={() => setSelectedDestination(null)}
          showMessage={showMessage}
        />
      </div>
    </section>
  )
}

import { type NextRequest, NextResponse } from "next/server"
import { REMOTE_API } from "@/lib/constants"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get("category")
  const municipio = searchParams.get("municipio")

  try {
    let url = `${REMOTE_API}/health-units?`
    if (category) url += `category=${encodeURIComponent(category)}&`
    if (municipio && municipio !== "todos") url += `municipio=${encodeURIComponent(municipio)}&`

    // Remove trailing &
    url = url.replace(/&$/, "")

    console.log("Fazendo requisição para:", url)

    const res = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    })

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`)
    }

    const data = await res.json()
    console.log("Dados recebidos da API:", Object.keys(data).length, "municípios")

    // Log do total de unidades
    const totalUnits = Object.values(data).reduce((sum: number, units: any) => {
      return sum + (Array.isArray(units) ? units.length : 0)
    }, 0)
    console.log("Total de unidades recebidas:", totalUnits)

    return NextResponse.json(data)
  } catch (error) {
    console.error("Erro ao buscar unidades de saúde:", error)
    return NextResponse.json({ error: "Erro ao buscar dados" }, { status: 500 })
  }
}

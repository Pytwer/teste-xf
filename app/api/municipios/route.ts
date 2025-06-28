import { NextResponse } from "next/server"
import { REMOTE_API } from "@/lib/constants"

export async function GET() {
  const res = await fetch(`${REMOTE_API}/municipios`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  })

  const data = await res.text()
  return new NextResponse(data, { status: res.status, headers: { "Content-Type": "application/json" } })
}

import { NextResponse } from 'next/server'
import { clickupClient } from '@/lib/clickup/client'

export async function GET() {
  const teamId = process.env.CLICKUP_TEAM_ID
  if (!teamId) return NextResponse.json({ members: [] })

  try {
    const data = await clickupClient.get(`/group?team_id=${teamId}`)
    const seen = new Set<number>()
    const members: { id: string; name: string; email: string }[] = []
    for (const group of data.groups ?? []) {
      for (const m of group.members ?? []) {
        if (!seen.has(m.id)) {
          seen.add(m.id)
          members.push({ id: String(m.id), name: m.username, email: m.email ?? '' })
        }
      }
    }
    members.sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ members: [] })
  }
}

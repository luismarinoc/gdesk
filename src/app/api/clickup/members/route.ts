import { NextResponse } from 'next/server'
import { clickupClient } from '@/lib/clickup/client'

export async function GET() {
  try {
    const data = await clickupClient.get('/team')
    const seen = new Set<number>()
    const members: { id: string; name: string; email: string }[] = []
    for (const team of data.teams ?? []) {
      for (const m of team.members ?? []) {
        const u = m.user ?? m
        if (!seen.has(u.id)) {
          seen.add(u.id)
          members.push({ id: String(u.id), name: u.username ?? u.email, email: u.email ?? '' })
        }
      }
    }
    members.sort((a, b) => a.name.localeCompare(b.name))
    return NextResponse.json({ members })
  } catch {
    return NextResponse.json({ members: [] })
  }
}

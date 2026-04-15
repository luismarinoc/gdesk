import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { listTickets, createTicket } from '@/services/clickup-ticket.service'
import { createTicketSchema } from '@/lib/validations/ticket.schema'
import type { UserRole } from '@/lib/auth/permissions'

const getCachedTickets = unstable_cache(
  () => listTickets(),
  ['clickup-tickets'],
  { revalidate: 300, tags: ['clickup-tickets'] }
)

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  return { user, role: (profile?.role ?? 'client') as UserRole }
}

export async function GET() {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const tickets = await getCachedTickets()
    const filtered = auth.role === 'client'
      ? tickets.filter(t => t.createdBy === auth.user.email)
      : tickets
    return NextResponse.json({ tickets: filtered })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const ticket = await createTicket(parsed.data)
    return NextResponse.json({ ticket }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

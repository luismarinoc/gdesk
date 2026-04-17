import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { listTickets, createTicket } from '@/services/clickup-ticket.service'
import { createTicketSchema } from '@/lib/validations/ticket.schema'
import type { UserRole } from '@/lib/auth/permissions'

function getCachedTickets(listId: string) {
  return unstable_cache(
    () => listTickets(listId),
    [`clickup-tickets-${listId}`],
    { revalidate: 300, tags: ['clickup-tickets', `clickup-tickets-${listId}`] }
  )()
}

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, clickup_list_id, clickup_user_name, permissions')
    .eq('id', user.id)
    .single()
  return {
    user,
    role: (profile?.role ?? 'client') as UserRole,
    clickupListId: profile?.clickup_list_id ?? null,
    clickupUserName: profile?.clickup_user_name ?? null,
    permissions: (profile?.permissions ?? []) as string[],
  }
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Admin puede pasar ?listId=xxx para filtrar por lista seleccionada
  const queryListId = req.nextUrl.searchParams.get('listId')

  if (auth.role !== 'admin' && !auth.clickupListId) {
    return NextResponse.json({ error: 'NO_LIST_ASSIGNED' }, { status: 403 })
  }

  const listId = auth.role === 'admin'
    ? (queryListId ?? auth.clickupListId ?? process.env.CLICKUP_LIST_ID!)
    : auth.clickupListId!

  try {
    let tickets = await getCachedTickets(listId)
    // Si el usuario tiene own_tickets_only, filtrar por su nombre de ClickUp
    if (auth.role !== 'admin' && auth.permissions.includes('own_tickets_only') && auth.clickupUserName) {
      tickets = tickets.filter(t => t.assignedTo === auth.clickupUserName)
    }
    return NextResponse.json({ tickets })
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

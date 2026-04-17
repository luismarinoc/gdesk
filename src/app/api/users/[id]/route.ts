import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const body = await req.json()

  const serviceClient = createServiceClient()
  const update: Record<string, unknown> = {}
  if ('clickup_list_id' in body) update.clickup_list_id = body.clickup_list_id ?? null
  if ('clickup_list_ids' in body && Array.isArray(body.clickup_list_ids)) {
    update.clickup_list_ids = body.clickup_list_ids
    // Sync single-id to first of the array for backward compat
    update.clickup_list_id = body.clickup_list_ids[0] ?? null
  }
  if ('clickup_user_id' in body) update.clickup_user_id = body.clickup_user_id ?? null
  if ('clickup_user_name' in body) update.clickup_user_name = body.clickup_user_name ?? null
  if ('role' in body && ['admin', 'agent', 'client'].includes(body.role)) update.role = body.role
  if ('permissions' in body && Array.isArray(body.permissions)) update.permissions = body.permissions

  const { error } = await serviceClient
    .from('user_profiles')
    .update(update)
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

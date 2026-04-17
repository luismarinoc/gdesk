import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ user: null })
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, clickup_list_id, permissions')
    .eq('id', user.id)
    .single()
  const role = profile?.role ?? 'client'
  const permissions: string[] = role === 'admin'
    ? ['dashboard', 'kanban', 'reports', 'workload', 'tickets']
    : (profile?.permissions ?? ['tickets'])
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      role,
      clickupListId: profile?.clickup_list_id ?? null,
      permissions,
    },
  })
}

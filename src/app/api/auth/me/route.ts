import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ user: null })
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, clickup_list_id')
    .eq('id', user.id)
    .single()
  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name ?? null,
      role: profile?.role ?? 'client',
      clickupListId: profile?.clickup_list_id ?? null,
    },
  })
}

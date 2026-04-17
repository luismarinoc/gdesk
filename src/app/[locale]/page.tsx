import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function firstPermittedRoute(role: string, perms: string[]): string {
  if (role === 'admin') return 'dashboard'
  if (perms.includes('dashboard')) return 'dashboard'
  if (perms.includes('kanban'))    return 'kanban'
  if (perms.includes('reports'))   return 'reports'
  if (perms.includes('workload'))  return 'workload'
  return 'tickets'
}

export default async function LocaleRootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect(`/${locale}/login`)

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('role, permissions')
    .eq('id', user.id)
    .single()

  const route = firstPermittedRoute(profile?.role ?? 'client', profile?.permissions ?? [])
  redirect(`/${locale}/${route}`)
}

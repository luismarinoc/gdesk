import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/${locale}/login`)
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, role, clickup_list_id, permissions')
    .eq('id', user.id)
    .single()

  const fullName = profile?.full_name ?? user.email ?? ''
  const role = profile?.role ?? 'client'
  const permissions: string[] = role === 'admin' ? ['dashboard', 'tickets'] : (profile?.permissions ?? ['tickets'])
  const noListAssigned = role !== 'admin' && !profile?.clickup_list_id

  if (noListAssigned) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1B3A6B]">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.5 18z"/>
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta no configurada</h2>
          <p className="text-sm text-gray-500 mb-6">Comunícate con soporte de GPartner para que te asignen acceso a tus tickets.</p>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#152d54] transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <DashboardShell locale={locale} userFullName={fullName} userRole={role} permissions={permissions}>
      {children}
    </DashboardShell>
  )
}

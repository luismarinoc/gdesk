import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Header } from '@/components/layout/Header'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'

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
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <div className="flex min-h-screen">
        <Sidebar locale={locale} userRole={profile?.role ?? 'client'} />
        <div className="flex-1 flex flex-col">
          <Header locale={locale} userFullName={profile?.full_name ?? user.email ?? ''} />
          <main className="flex-1 p-6 bg-gray-50">
            {children}
          </main>
        </div>
      </div>
    </NextIntlClientProvider>
  )
}

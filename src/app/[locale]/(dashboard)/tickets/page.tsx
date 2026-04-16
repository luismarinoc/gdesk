'use client'

import { Suspense, useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { MonthSelect } from '@/components/shared/MonthSelect'
import { AdminListSelector } from '@/components/shared/AdminListSelector'
import { useTickets, ADMIN_LIST_KEY } from '@/hooks/useTickets'

function TicketsPageInner() {
  const t = useTranslations('tickets')
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const month = searchParams.get('month') ?? 'all'

  const [isAdmin, setIsAdmin] = useState(false)
  const [adminList, setAdminList] = useState<{ id: string; name: string } | null>(null)
  const [showSelector, setShowSelector] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => {
        const role = data.user?.role
        if (role === 'admin') {
          setIsAdmin(true)
          const saved = localStorage.getItem(ADMIN_LIST_KEY)
          if (saved) {
            setAdminList(JSON.parse(saved))
          } else {
            setShowSelector(true)
          }
        }
        setReady(true)
      })
  }, [])

  const { tickets, loading, error } = useTickets(adminList?.id)

  function handleListSelect(id: string, name: string) {
    setAdminList({ id, name })
    setShowSelector(false)
  }

  return (
    <>
      {showSelector && <AdminListSelector onSelect={handleListSelect} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t('title')}</h1>
            {isAdmin && adminList && (
              <button
                onClick={() => setShowSelector(true)}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border border-[#1B3A6B]/20 text-[#1B3A6B] hover:bg-blue-50 transition-colors"
              >
                <span>{adminList.name}</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <MonthSelect value={month} />
            <Link href={`/${locale}/tickets/new`}>
              <Button>{t('new')}</Button>
            </Link>
          </div>
        </div>
        {error === 'NO_LIST_ASSIGNED' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8 text-center">
              <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#1B3A6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.69h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L7.91 10.5a16 16 0 0 0 6 6l.87-.87a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 21.5 18z"/>
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Cuenta no configurada</h2>
              <p className="text-sm text-gray-500 mb-6">Comunícate con soporte de GPartner para que te asignen acceso a tus tickets.</p>
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' })
                  window.location.href = `/${locale}/login`
                }}
                className="w-full py-2.5 rounded-lg bg-[#1B3A6B] text-white text-sm font-medium hover:bg-[#152d54] transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        )}
        {error && error !== 'NO_LIST_ASSIGNED' && <p className="text-red-500">{error}</p>}
        <TicketsTable tickets={ready ? tickets : []} loading={!ready || loading} monthFilter={month} />
      </div>
    </>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsPageInner />
    </Suspense>
  )
}

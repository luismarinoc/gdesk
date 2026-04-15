'use client'

import { Suspense } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { MonthSelect } from '@/components/shared/MonthSelect'
import { useTickets } from '@/hooks/useTickets'

function TicketsPageInner() {
  const t = useTranslations('tickets')
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const month = searchParams.get('month') ?? 'all'
  const { tickets, loading, error } = useTickets()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <MonthSelect value={month} />
          <Link href={`/${locale}/tickets/new`}>
            <Button>{t('new')}</Button>
          </Link>
        </div>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <TicketsTable tickets={tickets} loading={loading} monthFilter={month} />
    </div>
  )
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsPageInner />
    </Suspense>
  )
}

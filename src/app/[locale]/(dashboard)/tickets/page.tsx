'use client'

import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { TicketsTable } from '@/components/tickets/TicketsTable'
import { useTickets } from '@/hooks/useTickets'

export default function TicketsPage() {
  const t = useTranslations('tickets')
  const params = useParams()
  const locale = params.locale as string
  const { tickets, loading, error } = useTickets()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <Link href={`/${locale}/tickets/new`}>
          <Button>{t('new')}</Button>
        </Link>
      </div>
      {error && <p className="text-red-500">{error}</p>}
      <TicketsTable tickets={tickets} loading={loading} />
    </div>
  )
}

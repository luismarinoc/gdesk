import { getTranslations } from 'next-intl/server'
import { TicketForm } from '@/components/tickets/TicketForm'

export default async function NewTicketPage() {
  const t = await getTranslations('tickets')
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('new')}</h1>
      <TicketForm />
    </div>
  )
}

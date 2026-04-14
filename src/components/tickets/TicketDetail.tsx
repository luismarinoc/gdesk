// src/components/tickets/TicketDetail.tsx
'use client'

import { useTranslations } from 'next-intl'
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge'
import { RichTextRenderer } from '@/components/editor/RichTextRenderer'
import { CommentTimeline } from '@/components/comments/CommentTimeline'
import { Skeleton } from '@/components/ui/skeleton'
import type { GDeskTicket } from '@/types'

interface TicketDetailProps {
  ticket: GDeskTicket | null
  loading: boolean
}

export function TicketDetail({ ticket, loading }: TicketDetailProps) {
  const t = useTranslations('tickets')

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!ticket) return <p>Ticket not found.</p>

  return (
    <div className="space-y-6">
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-xl font-bold">{ticket.title}</h1>
          <span className="text-sm text-gray-400 shrink-0">{ticket.ticketNumber}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <TicketStatusBadge status={ticket.status} />
          <TicketPriorityBadge priority={ticket.priority} />
          {ticket.assignedTo && (
            <span className="text-sm text-gray-600">{t('assignedTo')}: {ticket.assignedTo}</span>
          )}
        </div>
        {ticket.description && (
          <RichTextRenderer html={ticket.description} />
        )}
        <div className="text-xs text-gray-400">
          {t('date')}: {ticket.createdAt.toLocaleString()}
        </div>
      </div>
      <CommentTimeline ticketId={ticket.id} />
    </div>
  )
}

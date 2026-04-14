// src/components/tickets/TicketStatusBadge.tsx
import { Badge } from '@/components/ui/badge'
import type { GDeskTicket } from '@/types'

const STATUS_STYLES: Record<GDeskTicket['status'], string> = {
  open: 'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-700',
}

const PRIORITY_STYLES: Record<GDeskTicket['priority'], string> = {
  urgent: 'bg-red-100 text-red-800',
  high: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-50 text-blue-700',
  low: 'bg-gray-100 text-gray-600',
}

export function TicketStatusBadge({ status }: { status: GDeskTicket['status'] }) {
  return (
    <Badge className={STATUS_STYLES[status]} variant="outline">
      {status.replace('_', ' ')}
    </Badge>
  )
}

export function TicketPriorityBadge({ priority }: { priority: GDeskTicket['priority'] }) {
  return (
    <Badge className={PRIORITY_STYLES[priority]} variant="outline">
      {priority}
    </Badge>
  )
}

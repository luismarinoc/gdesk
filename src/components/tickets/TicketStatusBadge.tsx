import { Badge } from '@/components/ui/badge'
import type { GDeskTicket } from '@/types'
import { STATUS_MAP } from '@/types'

const PRIORITY_STYLES: Record<GDeskTicket['priority'], string> = {
  urgent: 'bg-red-100 text-red-800',
  high:   'bg-orange-100 text-orange-800',
  normal: 'bg-blue-50 text-blue-700',
  low:    'bg-gray-100 text-gray-600',
}

const PRIORITY_LABELS: Record<GDeskTicket['priority'], string> = {
  urgent: 'Urgente',
  high:   'Alta',
  normal: 'Normal',
  low:    'Baja',
}

export function TicketStatusBadge({ status }: { status: GDeskTicket['status'] }) {
  const cfg = STATUS_MAP[status]
  return (
    <Badge
      variant="outline"
      style={{ backgroundColor: cfg?.color + '20', color: cfg?.color, borderColor: cfg?.color + '40' }}
    >
      {cfg?.label ?? status}
    </Badge>
  )
}

export function TicketPriorityBadge({ priority }: { priority: GDeskTicket['priority'] }) {
  return (
    <Badge className={PRIORITY_STYLES[priority]} variant="outline">
      {PRIORITY_LABELS[priority] ?? priority}
    </Badge>
  )
}

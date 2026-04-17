import type { GDeskTicket } from '@/types'
import { STATUS_MAP } from '@/types'

const PRIORITY_COLORS: Record<GDeskTicket['priority'], { bg: string; text: string }> = {
  urgent: { bg: 'bg-red-50',    text: 'text-red-700'    },
  high:   { bg: 'bg-orange-50', text: 'text-orange-700' },
  normal: { bg: 'bg-blue-50',   text: 'text-blue-700'   },
  low:    { bg: 'bg-gray-100',  text: 'text-gray-500'   },
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
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap"
      style={{ backgroundColor: cfg?.color + '18', color: cfg?.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg?.color }} />
      {cfg?.label ?? status}
    </span>
  )
}

export function TicketPriorityBadge({ priority }: { priority: GDeskTicket['priority'] }) {
  const { bg, text } = PRIORITY_COLORS[priority] ?? { bg: 'bg-gray-100', text: 'text-gray-500' }
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold ${bg} ${text}`}>
      <svg className="w-3 h-3 fill-current" viewBox="0 0 16 16">
        <path d="M2 2h10l-2 4 2 4H2V2z" />
      </svg>
      {PRIORITY_LABELS[priority] ?? priority}
    </span>
  )
}

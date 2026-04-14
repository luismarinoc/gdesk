import type { GDeskTicket, GDeskComment } from '@/types'

export function clickupStatusToGDesk(
  status: string
): GDeskTicket['status'] {
  const map: Record<string, GDeskTicket['status']> = {
    open: 'open',
    'in progress': 'in_progress',
    resolved: 'resolved',
    closed: 'closed',
  }
  return map[status.toLowerCase()] ?? 'open'
}

export function clickupPriorityToGDesk(
  priority: number | null
): GDeskTicket['priority'] {
  const map: Record<number, GDeskTicket['priority']> = {
    1: 'urgent',
    2: 'high',
    3: 'normal',
    4: 'low',
  }
  return priority !== null ? (map[priority] ?? 'normal') : 'normal'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickupTaskToTicket(task: any): GDeskTicket {
  return {
    id: task.id,
    ticketNumber: task.custom_id ?? task.id,
    title: task.name,
    description: task.description ?? '',
    status: clickupStatusToGDesk(task.status?.status ?? 'open'),
    priority: clickupPriorityToGDesk(task.priority?.priority ?? null),
    createdAt: new Date(parseInt(task.date_created)),
    updatedAt: new Date(parseInt(task.date_updated)),
    createdBy: task.creator?.username ?? '',
    assignedTo: task.assignees?.[0]?.username ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickupCommentToGDesk(comment: any, ticketId: string): GDeskComment {
  return {
    id: comment.id,
    ticketId,
    author: comment.user?.username ?? '',
    content: comment.comment_text ?? '',
    createdAt: new Date(parseInt(comment.date)),
    attachments: [],
  }
}

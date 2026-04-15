import type { GDeskTicket, GDeskComment } from '@/types'
import { clickupTextToHtml, clickupRichCommentToHtml } from './parseDescription'

export function clickupStatusToGDesk(
  status: string
): GDeskTicket['status'] {
  const map: Record<string, GDeskTicket['status']> = {
    // Spanish (Gpartnerc workspace) — preserve original identity
    backlog:                 'backlog',
    'listo para trabajar':   'listo_para_trabajar',
    'en progreso':           'en_progreso',
    'supervisión y control': 'supervision_y_control',
    cerrado:                 'cerrado',
    // English fallback
    open:         'open',
    'in progress':'in_progress',
    resolved:     'resolved',
    closed:       'closed',
  }
  return map[status.toLowerCase()] ?? 'backlog'
}

export function clickupPriorityToGDesk(
  priority: string | number | null
): GDeskTicket['priority'] {
  if (priority === null || priority === undefined) return 'normal'
  // ClickUp returns priority as string ("urgent","high","normal","low")
  // but can also return numeric id (1=urgent,2=high,3=normal,4=low)
  const strMap: Record<string, GDeskTicket['priority']> = {
    urgent: 'urgent',
    high: 'high',
    normal: 'normal',
    low: 'low',
  }
  const numMap: Record<number, GDeskTicket['priority']> = {
    1: 'urgent',
    2: 'high',
    3: 'normal',
    4: 'low',
  }
  if (typeof priority === 'string') return strMap[priority.toLowerCase()] ?? 'normal'
  return numMap[priority] ?? 'normal'
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickupTaskToTicket(task: any): GDeskTicket {
  return {
    id: task.id,
    ticketNumber: task.custom_id ?? task.id,
    title: task.name,
    description: clickupTextToHtml(task.description ?? ''),
    status: clickupStatusToGDesk(task.status?.status ?? 'open'),
    priority: clickupPriorityToGDesk(task.priority?.priority ?? null),
    createdAt: new Date(parseInt(task.date_created)),
    updatedAt: new Date(parseInt(task.date_updated)),
    dueDate: task.due_date ? new Date(parseInt(task.due_date)) : null,
    createdBy: task.creator?.username ?? '',
    assignedTo: task.assignees?.[0]?.username ?? null,
    assignees: (task.assignees ?? []).map((a: Record<string, string>) => a.username).filter(Boolean),
    tags: (task.tags ?? []).map((t: Record<string, string>) => t.name).filter(Boolean),
    listName: task.list?.name ?? null,
    folderName: task.folder?.name && task.folder.name !== 'hidden' ? task.folder.name : null,
    timeEstimate: task.time_estimate ?? null,
    timeSpent: task.time_spent ?? null,
    clickupUrl: task.url ?? null,
    watchers: (task.watchers ?? []).map((w: Record<string, string>) => w.username).filter(Boolean),
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapClickupCommentToGDesk(comment: any, ticketId: string): GDeskComment {
  return {
    id: comment.id,
    ticketId,
    author: comment.user?.username ?? '',
    authorId: comment.user?.id ? String(comment.user.id) : undefined,
    avatarUrl: comment.user?.profilePicture ?? null,
    content: (() => {
      const raw = comment.comment_text ?? ''
      // If comment_text is raw HTML (stored by us before plain-text fix), use it directly
      if (raw.trimStart().startsWith('<')) return raw
      return Array.isArray(comment.comment)
        ? clickupRichCommentToHtml(comment.comment)
        : clickupTextToHtml(raw)
    })(),
    createdAt: new Date(parseInt(comment.date)),
    attachments: [],
    replyCount: (() => { const rc = comment.comment_count ?? comment.reply_count ?? 0; if (rc > 0) console.log('[comment reply count]', comment.id, rc); return rc })(),
  }
}

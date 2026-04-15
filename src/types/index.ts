export type GDeskTicket = {
  id: string
  ticketNumber: string
  title: string
  description: string
  status:
    | 'backlog'
    | 'listo_para_trabajar'
    | 'en_progreso'
    | 'supervision_y_control'
    | 'cerrado'
    | 'open'
    | 'in_progress'
    | 'resolved'
    | 'closed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  createdAt: Date
  updatedAt: Date
  dueDate: Date | null
  createdBy: string
  assignedTo: string | null
  assignees: string[]
  tags: string[]
  listName: string | null
  folderName: string | null
  timeEstimate: number | null   // ms
  timeSpent: number | null      // ms
  clickupUrl: string | null
  watchers: string[]
}

export type GDeskComment = {
  id: string
  ticketId: string
  author: string
  authorId?: string
  avatarUrl?: string | null
  content: string
  createdAt: Date
  attachments: GDeskAttachment[]
  replyCount: number
}

export type GDeskAttachment = {
  id: string
  name: string
  url: string
  mimeType: string
  sizeBytes: number
  uploadedAt: Date
}

export type UserProfile = {
  id: string
  full_name: string
  avatar_url: string | null
  role: 'admin' | 'agent' | 'client'
  locale: 'es' | 'en'
}

// ── Shared status config ────────────────────────────────────────────────────
export const STATUS_CONFIG: {
  key: GDeskTicket['status']
  label: string
  color: string
  bg: string
  border: string
}[] = [
  { key: 'backlog',               label: 'Backlog',               color: '#787486', bg: 'bg-gray-50',    border: 'border-gray-200'   },
  { key: 'listo_para_trabajar',   label: 'Listo para Trabajar',   color: '#e11d48', bg: 'bg-rose-50',    border: 'border-rose-200'   },
  { key: 'en_progreso',           label: 'En Progreso',           color: '#4194f0', bg: 'bg-blue-50',    border: 'border-blue-200'   },
  { key: 'supervision_y_control', label: 'Supervisión y Control', color: '#f97316', bg: 'bg-orange-50',  border: 'border-orange-200' },
  { key: 'cerrado',               label: 'Cerrado',               color: '#22c55e', bg: 'bg-green-50',   border: 'border-green-200'  },
  // English fallbacks
  { key: 'open',       label: 'Abierto',    color: '#f97316', bg: 'bg-orange-50', border: 'border-orange-200' },
  { key: 'in_progress',label: 'En Progreso',color: '#4194f0', bg: 'bg-blue-50',   border: 'border-blue-200'   },
  { key: 'resolved',   label: 'Resuelto',   color: '#22c55e', bg: 'bg-green-50',  border: 'border-green-200'  },
  { key: 'closed',     label: 'Cerrado',    color: '#787486', bg: 'bg-gray-50',   border: 'border-gray-200'   },
]

export const STATUS_MAP: Record<GDeskTicket['status'], { label: string; color: string }> =
  Object.fromEntries(STATUS_CONFIG.map(s => [s.key, { label: s.label, color: s.color }])) as Record<GDeskTicket['status'], { label: string; color: string }>

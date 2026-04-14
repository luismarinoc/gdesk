export type GDeskTicket = {
  id: string
  ticketNumber: string
  title: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'urgent' | 'high' | 'normal' | 'low'
  createdAt: Date
  updatedAt: Date
  createdBy: string
  assignedTo: string | null
}

export type GDeskComment = {
  id: string
  ticketId: string
  author: string
  content: string
  createdAt: Date
  attachments: GDeskAttachment[]
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

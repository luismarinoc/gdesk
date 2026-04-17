// src/services/clickup-comment.service.ts
import { clickupClient } from '@/lib/clickup/client'
import { mapClickupCommentToGDesk } from '@/lib/clickup/transformers'
import type { GDeskComment } from '@/types'
import type { CreateCommentInput } from '@/lib/validations/comment.schema'

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function listComments(ticketId: string): Promise<GDeskComment[]> {
  const data = await clickupClient.get(`/task/${ticketId}/comment`)
  const comments = data.comments ?? []
  // Sort oldest-first (chronological order)
  const sorted = [...comments].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.date) - Number(b.date))
  return sorted.map((c: unknown) => mapClickupCommentToGDesk(c, ticketId))
}

export async function listReplies(commentId: string, ticketId: string): Promise<GDeskComment[]> {
  const data = await clickupClient.get(`/comment/${commentId}/reply`)
  const replies = data.comments ?? []
  const sorted = [...replies].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.date) - Number(b.date))
  return sorted.map((c: unknown) => mapClickupCommentToGDesk(c, ticketId))
}

export async function deleteComment(commentId: string): Promise<void> {
  await clickupClient.delete(`/comment/${commentId}`)
}

export async function createComment(
  ticketId: string,
  input: CreateCommentInput
): Promise<GDeskComment> {
  // Si el contenido tiene imágenes, enviar HTML directo para no perder las URLs
  const hasImages = input.content.includes('<img')
  const text = hasImages ? input.content : htmlToPlainText(input.content)
  const endpoint = input.parentCommentId
    ? `/comment/${input.parentCommentId}/reply`
    : `/task/${ticketId}/comment`
  const data = await clickupClient.post(endpoint, {
    comment_text: text,
    notify_all: false,
  })
  return mapClickupCommentToGDesk(data, ticketId)
}

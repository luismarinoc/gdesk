// src/services/clickup-comment.service.ts
import { clickupClient } from '@/lib/clickup/client'
import { mapClickupCommentToGDesk } from '@/lib/clickup/transformers'
import type { GDeskComment } from '@/types'
import type { CreateCommentInput } from '@/lib/validations/comment.schema'

export async function listComments(ticketId: string): Promise<GDeskComment[]> {
  const data = await clickupClient.get(`/task/${ticketId}/comment`)
  return (data.comments ?? []).map((c: unknown) => mapClickupCommentToGDesk(c, ticketId))
}

export async function createComment(
  ticketId: string,
  input: CreateCommentInput
): Promise<GDeskComment> {
  const data = await clickupClient.post(`/task/${ticketId}/comment`, {
    comment_text: input.content,
    notify_all: false,
  })
  return mapClickupCommentToGDesk(data, ticketId)
}

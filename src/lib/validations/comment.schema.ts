// src/lib/validations/comment.schema.ts
import { z } from 'zod'

export const createCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  parentCommentId: z.string().optional(),
  commentIndex: z.number().optional(),
})

export type CreateCommentInput = z.infer<typeof createCommentSchema>

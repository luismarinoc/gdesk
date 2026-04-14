// src/components/comments/CommentTimeline.tsx
'use client'

import { useTranslations } from 'next-intl'
import { Skeleton } from '@/components/ui/skeleton'
import { CommentItem } from './CommentItem'
import { CommentEditor } from './CommentEditor'
import { useComments } from '@/hooks/useComments'

export function CommentTimeline({ ticketId }: { ticketId: string }) {
  const t = useTranslations('tickets.detail')
  const { comments, loading, error, addComment } = useComments(ticketId)

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold">{t('comments')}</h2>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map(c => <CommentItem key={c.id} comment={c} />)}
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      )}
      <CommentEditor onSubmit={addComment} />
    </div>
  )
}

// src/components/comments/CommentItem.tsx
import { RichTextRenderer } from '@/components/editor/RichTextRenderer'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import type { GDeskComment } from '@/types'

export function CommentItem({ comment }: { comment: GDeskComment }) {
  const initials = comment.author
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <div className="flex gap-3">
      <Avatar className="w-8 h-8 mt-1 shrink-0">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm">{comment.author}</span>
          <span className="text-xs text-gray-400">
            {comment.createdAt.toLocaleString()}
          </span>
        </div>
        <div className="bg-white border rounded-md p-3">
          <RichTextRenderer html={comment.content} />
        </div>
      </div>
    </div>
  )
}

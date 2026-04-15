// src/components/comments/CommentTimeline.tsx
'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { CommentItem } from './CommentItem'
import { CommentEditor } from './CommentEditor'
import { useComments } from '@/hooks/useComments'
import type { GDeskComment } from '@/types'

function normalize(s: string) {
  return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function CommentTimeline({ ticketId }: { ticketId: string }) {
  const { comments, loading, error, currentUserName, addComment, deleteComment } = useComments(ticketId)
  const [threadComment, setThreadComment] = useState<GDeskComment | null>(null)
  const [replies, setReplies] = useState<GDeskComment[]>([])
  const [repliesLoading, setRepliesLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const threadBottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!threadComment) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments.length, threadComment])

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [replies.length])

  const fetchReplies = useCallback(async (commentId: string): Promise<GDeskComment[]> => {
    setRepliesLoading(true)
    try {
      const res = await fetch(`/api/clickup/comments/${commentId}/replies?ticketId=${ticketId}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const mapped: GDeskComment[] = data.replies.map((r: GDeskComment & { createdAt: string }) => ({
        ...r,
        createdAt: new Date(r.createdAt),
      }))
      setReplies(mapped)
      return mapped
    } catch {
      setReplies([])
      return []
    } finally {
      setRepliesLoading(false)
    }
  }, [ticketId])

  function openThread(comment: GDeskComment) {
    setThreadComment(comment)
    setReplies([])
    fetchReplies(comment.id)
  }

  async function handleMainSubmit(content: string) {
    await addComment(content)
  }

  async function handleThreadSubmit(content: string) {
    await addComment(content, threadComment!.id)
    const updatedReplies = await fetchReplies(threadComment!.id)
    setThreadComment(prev => prev ? { ...prev, replyCount: updatedReplies.length } : prev)
  }

  async function handleDeleteReply(commentId: string) {
    await deleteComment(commentId)
    setReplies(prev => prev.filter(r => r.id !== commentId))
    setThreadComment(prev => prev ? { ...prev, replyCount: Math.max(0, (prev.replyCount || 1) - 1) } : prev)
  }

  const wrapperClass = "flex flex-col flex-1 min-h-0 overflow-hidden"

  /* ── Thread view ── */
  if (threadComment) {
    return (
      <div className={wrapperClass}>
        <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-100 flex-shrink-0">
          <button
            onClick={() => setThreadComment(null)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1B3A6B] transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            Volver
          </button>
          <span className="text-xs font-semibold text-gray-700 ml-1">
            Hilo de {threadComment.author}
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
          <CommentItem
            comment={threadComment}
            isOwner={!!currentUserName && normalize(threadComment.author) === normalize(currentUserName)}
            onDelete={deleteComment}
          />
          {repliesLoading ? (
            <div className="pl-4 space-y-2">
              <Skeleton className="h-16 w-full" />
            </div>
          ) : replies.length > 0 && (
            <div className="pl-4 border-l-2 border-gray-100 space-y-2">
              {replies.map(r => (
                <CommentItem key={r.id} comment={r} />
              ))}
            </div>
          )}
          <div ref={threadBottomRef} />
        </div>
        <div className="border-t border-gray-200 bg-white flex-shrink-0">
          <CommentEditor onSubmit={handleThreadSubmit} placeholder="Responder al comentario..." />
        </div>
      </div>
    )
  }

  /* ── Main view ── */
  return (
    <div className={wrapperClass}>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">Sin comentarios aún.</p>
        ) : (
          comments.map(c => {
            const isOwner = !!currentUserName && normalize(c.author) === normalize(currentUserName)
            return (
              <CommentItem
                key={c.id}
                comment={c}
                onReply={() => openThread(c)}
                isOwner={isOwner}
                onDelete={deleteComment}
              />
            )
          })
        )}
        {error && <p className="text-xs text-red-500 mt-2">{error}</p>}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 bg-white flex-shrink-0">
        <CommentEditor onSubmit={handleMainSubmit} />
      </div>
    </div>
  )
}

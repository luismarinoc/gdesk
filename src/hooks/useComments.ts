// src/hooks/useComments.ts
import { useState, useEffect, useCallback } from 'react'
import type { GDeskComment } from '@/types'

export function useComments(ticketId: string) {
  const [comments, setComments] = useState<GDeskComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserName, setCurrentUserName] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(data => setCurrentUserName(data.user?.fullName ?? null))
  }, [])

  const fetchComments = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/clickup/tickets/${ticketId}/comments`)
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to fetch comments')
      }
      const data = await res.json()
      setComments(
        data.comments.map((c: GDeskComment & { createdAt: string }) => ({
          ...c,
          createdAt: new Date(c.createdAt),
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [ticketId])

  useEffect(() => {
    fetchComments()
  }, [fetchComments])

  async function addComment(content: string, parentCommentId?: string) {
    try {
      const res = await fetch(`/api/clickup/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId }),
      })
      if (!res.ok) throw new Error('Failed to add comment')
      await fetchComments()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  async function deleteComment(commentId: string) {
    try {
      const res = await fetch(`/api/clickup/comments/${commentId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        console.error('[deleteComment] error:', body)
        throw new Error(body.error ?? 'Failed to delete comment')
      }
      setComments(prev => prev.filter(c => c.id !== commentId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  return { comments, loading, error, currentUserName, addComment, deleteComment }
}

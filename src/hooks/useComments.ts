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

  async function addComment(
    content: string,
    parentCommentId?: string,
    onImagesAttached?: (attachments: import('@/types').GDeskAttachment[]) => void,
  ) {
    try {
      const commentIndex = parentCommentId ? undefined : comments.length + 1
      const res = await fetch(`/api/clickup/tickets/${ticketId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, parentCommentId, commentIndex }),
      })
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}))
        throw new Error(errBody.error ?? 'Failed to add comment')
      }
      const data = await res.json()
      const newComment: GDeskComment = {
        ...data.comment,
        author: data.comment.author || currentUserName || '?',
        content,
        createdAt: data.comment.createdAt instanceof Date && !isNaN(data.comment.createdAt.getTime())
          ? data.comment.createdAt
          : new Date(),
      }
      if (!parentCommentId) {
        // Upload embedded images as ClickUp attachments with label "Imagen X.Y"
        if (onImagesAttached) {
          const commentIndex = comments.length + 1
          const imgMatches = [...content.matchAll(/<img[^>]+src="([^"]+)"/g)]
          if (imgMatches.length > 0) {
            const created: import('@/types').GDeskAttachment[] = []
            await Promise.all(imgMatches.map(async (m, i) => {
              const url = m[1]
              const name = `Imagen ${commentIndex}.${i + 1}`
              const form = new FormData()
              form.append('fromUrl', url)
              form.append('name', `${name}.png`)
              try {
                const attRes = await fetch(`/api/clickup/tickets/${ticketId}/attachments`, { method: 'POST', body: form })
                if (attRes.ok) {
                  const attData = await attRes.json()
                  const att = attData.attachment
                  created.push({
                    id: att.id ?? String(Date.now() + i),
                    name,
                    url: att.url_w_host ?? att.url ?? url,
                    mimeType: 'image/png',
                    sizeBytes: 0,
                    uploadedAt: new Date(),
                  })
                }
              } catch { /* silencioso — el comentario ya se subió */ }
            }))
            if (created.length > 0) onImagesAttached(created)
          }
        }
        setComments(prev => [...prev, newComment])
      }
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

  function updateReplyCount(commentId: string, count: number) {
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, replyCount: count } : c))
  }

  return { comments, loading, error, currentUserName, addComment, deleteComment, updateReplyCount, refresh: fetchComments }
}

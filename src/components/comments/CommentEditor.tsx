// src/components/comments/CommentEditor.tsx
'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

interface CommentEditorProps {
  onSubmit: (content: string) => Promise<void>
}

export function CommentEditor({ onSubmit }: CommentEditorProps) {
  const t = useTranslations('tickets.detail')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      await onSubmit(content)
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-2">
      <RichTextEditor
        placeholder={t('addComment')}
        onChange={setContent}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
      <Button onClick={handleSubmit} disabled={submitting || !content.trim()}>
        {submitting ? '...' : t('submit')}
      </Button>
    </div>
  )
}

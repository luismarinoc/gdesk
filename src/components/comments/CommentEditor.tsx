// src/components/comments/CommentEditor.tsx
'use client'

import { useState, useRef } from 'react'
import { RichTextEditor } from '@/components/editor/RichTextEditor'

interface CommentEditorProps {
  onSubmit: (content: string) => Promise<void>
  replyTo?: string
  placeholder?: string
}

export function CommentEditor({ onSubmit, replyTo, placeholder }: CommentEditorProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('bucket', 'comment-images')
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error al subir archivo')
      const { url } = await res.json()
      setAttachments(prev => [...prev, { name: file.name, url }])
    } catch {
      setError('Error al subir el archivo')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit() {
    const isEmpty = !content.trim() || content === '<p></p>'
    if (isEmpty && attachments.length === 0) return
    setSubmitting(true)
    setError('')
    try {
      let finalContent = isEmpty ? '' : content
      if (attachments.length > 0) {
        const attHtml = attachments.map(a => {
          const isImage = /\.(png|jpe?g|gif|webp|svg)/i.test(a.name)
          return isImage
            ? `<img src="${a.url}" alt="${a.name}" style="max-width:320px;border-radius:6px;margin:4px 0;display:block;" />`
            : `<a href="${a.url}" target="_blank">📎 ${a.name}</a>`
        }).join('')
        finalContent = finalContent + attHtml
      }
      await onSubmit(finalContent)
      setContent('')
      setAttachments([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setSubmitting(false)
    }
  }

  const isEmpty = (!content.trim() || content === '<p></p>') && attachments.length === 0

  return (
    <div className="px-3 pt-2 pb-2">
      {/* Input area */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <RichTextEditor
          key={submitting ? 'reset' : (replyTo ?? 'active')}
          placeholder={placeholder ?? (replyTo ? `Respondiendo a ${replyTo}...` : 'Escribe un comentario...')}
          onChange={setContent}
          hideToolbar
          borderless
          minHeight="80px"
        />

        {/* Attachments preview */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pb-2">
            {attachments.map((a, i) => (
              <div key={i} className="flex items-center gap-1 bg-gray-100 rounded-full px-2.5 py-0.5 text-xs text-gray-600">
                <span>📎 {a.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} className="text-gray-400 hover:text-red-500 ml-0.5 font-bold">×</button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom toolbar */}
        <div className="flex items-center justify-between px-2 py-1.5 border-t border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-0.5">
            {/* Attach file */}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              title="Agregar un archivo"
              className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B3A6B] hover:bg-gray-100 transition-colors"
            >
              {uploading ? (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              )}
            </button>
          </div>

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={submitting || isEmpty}
            title="Enviar comentario"
            className={`p-1.5 rounded-lg transition-colors ${
              isEmpty || submitting
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-[#1B3A6B] hover:bg-[#1B3A6B] hover:text-white'
            }`}
          >
            {submitting ? (
              <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
      <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
    </div>
  )
}

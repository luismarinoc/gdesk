import { useState, useRef, useEffect } from 'react'
import { RichTextRenderer } from '@/components/editor/RichTextRenderer'
import type { GDeskComment } from '@/types'

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}

const AVATAR_COLORS = [
  '#1B3A6B', '#02579b', '#595d66', '#e11d48', '#4194f0',
  '#f97316', '#22c55e', '#8b5cf6', '#0ea5e9', '#6366f1',
]

function avatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length
  return AVATAR_COLORS[h]
}

function formatDate(date: Date) {
  return date.toLocaleString('es', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// Extrae texto plano del HTML para detectar el prefijo "Nombre: "
function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').trim()
}

// Si el contenido empieza con "Nombre: texto", extrae el nombre y limpia el HTML
function parseAuthorPrefix(content: string): { author: string | null; body: string } {
  const plain = htmlToText(content)
  const match = plain.match(/^([^:<\n]{2,40}):\s+([\s\S]+)$/)
  if (!match) return { author: null, body: content }
  const author = match[1].trim()
  const bodyText = match[2].trim()
  // Reconstruir el HTML sin el prefijo
  const prefixPattern = new RegExp(author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ':\\s*', 'g')
  const body = content.replace(prefixPattern, '')
  return { author, body }
}

export function CommentItem({
  comment,
  onReply,
  isOwner,
  onDelete,
}: {
  comment: GDeskComment
  onReply?: () => void
  isOwner?: boolean
  onDelete?: (id: string) => void
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { author: prefixAuthor, body: cleanContent } = parseAuthorPrefix(comment.content ?? '')
  const displayAuthor = prefixAuthor ?? comment.author
  const displayContent = prefixAuthor ? cleanContent : (comment.content ?? '')

  const initials = getInitials(displayAuthor)
  const bg = avatarColor(displayAuthor)

  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [menuOpen])

  async function handleDelete() {
    setMenuOpen(false)
    setDeleting(true)
    setDeleteError(false)
    try {
      await onDelete?.(comment.id)
    } catch {
      setDeleteError(true)
      setTimeout(() => setDeleteError(false), 3000)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0"
          style={{ backgroundColor: bg }}
        >
          {initials}
        </div>
        <div className="flex items-baseline gap-2 min-w-0 flex-1">
          <span className="text-sm font-semibold text-gray-800 truncate">{displayAuthor}</span>
          <span className="text-xs text-gray-400 whitespace-nowrap">{formatDate(comment.createdAt)}</span>
        </div>
        {isOwner && (
          <div ref={menuRef} className="relative flex-shrink-0">
            <button
              onClick={() => setMenuOpen(v => !v)}
              disabled={deleting}
              className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {deleting ? (
                <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
                </svg>
              )}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[160px]">
                <button
                  onClick={handleDelete}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                    <path d="M10 11v6"/><path d="M14 11v6"/>
                    <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                  </svg>
                  Eliminar comentario
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {deleteError && (
        <p className="px-4 py-1 text-xs text-red-500">No se pudo eliminar el comentario.</p>
      )}

      {/* Content */}
      <div className="px-4 pb-2 text-sm text-gray-700">
        <RichTextRenderer html={displayContent} />
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-50">
        <div className="flex items-center gap-3 text-gray-400">
          <button className="hover:text-gray-600 transition-colors" title="Me gusta">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
              <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
          </button>
          <button className="hover:text-gray-600 transition-colors" title="Reacción">
            <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M8 13s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2">
          {comment.replyCount > 0 && onReply && (
            <button
              onClick={onReply}
              className="flex items-center gap-1.5 text-xs text-[#1B3A6B] hover:underline font-medium transition-colors"
            >
              <span>{comment.replyCount} respuesta{comment.replyCount !== 1 ? 's' : ''}</span>
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold flex-shrink-0"
                style={{ backgroundColor: bg }}
              >
                {initials}
              </div>
            </button>
          )}
          {(comment.replyCount === 0 || !onReply) && onReply && (
            <button
              onClick={onReply}
              className="text-xs text-gray-400 hover:text-[#1B3A6B] font-medium transition-colors"
            >
              Respuesta
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

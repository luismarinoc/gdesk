// src/components/tickets/TicketDetail.tsx
'use client'

import { useRef, useState, useEffect } from 'react'
import { TicketStatusBadge, TicketPriorityBadge } from './TicketStatusBadge'
import { RichTextRenderer } from '@/components/editor/RichTextRenderer'
import { CommentTimeline } from '@/components/comments/CommentTimeline'
import { Skeleton } from '@/components/ui/skeleton'
import type { GDeskTicket } from '@/types'

interface TicketDetailProps {
  ticket: GDeskTicket | null
  loading: boolean
}

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 last:border-0">
      <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide w-28 shrink-0 pt-0.5">{label}</span>
      <div className="flex-1 text-sm text-gray-700">{children}</div>
    </div>
  )
}

function timeAgo(date: Date): string {
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Recién'
  if (minutes < 60) return `${minutes} min hace`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h hace`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d hace`
  return date.toLocaleDateString('es', { month: 'short', day: 'numeric' })
}

function isImage(att: import('@/types').GDeskAttachment) {
  if (att.mimeType?.startsWith('image/')) return true
  return /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(att.name)
}

function isPdf(att: import('@/types').GDeskAttachment) {
  if (att.mimeType === 'application/pdf') return true
  return /\.pdf$/i.test(att.name)
}

async function downloadAtt(att: import('@/types').GDeskAttachment) {
  try {
    const proxyUrl = `/api/clickup/attachment?url=${encodeURIComponent(att.url)}`
    const res = await fetch(proxyUrl)
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const l = document.createElement('a')
    l.href = blobUrl
    l.download = att.name
    document.body.appendChild(l)
    l.click()
    document.body.removeChild(l)
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
  } catch { /* silencioso */ }
}

function AttachmentCard({ att, onDelete, listMode }: {
  att: import('@/types').GDeskAttachment
  onDelete?: (id: string) => void
  listMode?: boolean
}) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const uploadedAt = att.uploadedAt instanceof Date ? att.uploadedAt : new Date(att.uploadedAt)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  if (listMode) {
    return (
      <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-gray-50 group border border-transparent hover:border-gray-200 transition-all">
        <div className="w-7 h-7 flex-shrink-0 flex items-center justify-center bg-gray-100 rounded">
          {isImage(att)
            ? <img src={att.url} alt={att.name} className="w-full h-full object-cover rounded" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
            : isPdf(att)
              ? <span className="text-[9px] font-bold text-red-400">PDF</span>
              : <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>}
        </div>
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex-1 min-w-0">
          <p className="text-[11px] font-medium text-gray-700 truncate hover:text-[#1B3A6B]">{att.name}</p>
          <p className="text-[10px] text-gray-400">{timeAgo(uploadedAt)}</p>
        </a>
        <div ref={menuRef} className="relative flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className={`w-6 h-6 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-all ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); downloadAtt(att) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Descargar
              </button>
              {onDelete && (
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(false); onDelete(att.id) }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                  Eliminar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="relative group border border-gray-200 rounded-lg overflow-hidden bg-white hover:border-[#1B3A6B] hover:shadow-sm transition-all" style={{ width: 250 }}>
      <a href={att.url} target="_blank" rel="noopener noreferrer" className="block">
        {/* Square thumbnail */}
        <div className="bg-gray-50 flex items-center justify-center overflow-hidden" style={{ width: 250, height: 250 }}>
          {isImage(att) ? (
            <img src={att.url} alt={att.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
          ) : isPdf(att) ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64" fill="none">
              <rect x="8" y="4" width="36" height="48" rx="4" fill="#fde8e8" stroke="#f87171" strokeWidth="1.5"/>
              <rect x="28" y="4" width="16" height="16" rx="2" fill="#f87171" opacity="0.3"/>
              <path d="M28 4 L44 20" stroke="#f87171" strokeWidth="1.5"/>
              <text x="32" y="38" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#f87171">PDF</text>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          )}
        </div>
        {/* Info */}
        <div className="px-1.5 py-1 border-t border-gray-100">
          <p className="text-[10px] font-medium text-gray-700 truncate">{att.name}</p>
          <p className="text-[9px] text-gray-400">{timeAgo(uploadedAt)}</p>
        </div>
      </a>
      {/* Three-dots menu */}
      <div ref={menuRef} className="absolute top-1.5 right-1.5">
        <button
          onClick={e => { e.preventDefault(); setMenuOpen(v => !v) }}
          className={`w-6 h-6 flex items-center justify-center rounded-md bg-white/90 shadow-sm text-gray-500 hover:text-gray-800 transition-all ${menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            <button
              onClick={e => { e.preventDefault(); setMenuOpen(false); downloadAtt(att) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Descargar
            </button>
            {onDelete && (
              <button
                onClick={e => { e.preventDefault(); setMenuOpen(false); onDelete(att.id) }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
                Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export function TicketDetail({ ticket, loading }: TicketDetailProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadMsg, setUploadMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [localAttachments, setLocalAttachments] = useState<import('@/types').GDeskAttachment[]>([])
  const [dragging, setDragging] = useState(false)
  const [attViewMode, setAttViewMode] = useState<'grid' | 'list'>('grid')
  const [refreshing, setRefreshing] = useState(false)
  const refreshCommentsRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (ticket) setLocalAttachments(ticket.attachments ?? [])
  }, [ticket?.id])

  async function handleAttach(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !ticket) return
    e.target.value = ''
    setUploading(true)
    setUploadMsg(null)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`/api/clickup/tickets/${ticket.id}/attachments`, { method: 'POST', body: form })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Error al adjuntar')
      }
      const data = await res.json()
      const att = data.attachment
      setLocalAttachments(prev => [{
        id: att.id ?? String(Date.now()),
        name: att.title ?? file.name,
        url: att.url_w_host ?? att.url ?? '',
        mimeType: file.type,
        sizeBytes: file.size,
        uploadedAt: new Date(),
      }, ...prev])
      setUploadMsg({ ok: true, text: `"${file.name}" adjuntado correctamente.` })
    } catch (err) {
      setUploadMsg({ ok: false, text: err instanceof Error ? err.message : 'Error al adjuntar' })
    } finally {
      setUploading(false)
      setTimeout(() => setUploadMsg(null), 4000)
    }
  }
  async function handleDeleteAttachment(attId: string) {
    try {
      const res = await fetch(`/api/clickup/attachments/${attId}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        setLocalAttachments(prev => prev.filter(a => a.id !== attId))
      } else {
        setUploadMsg({ ok: false, text: 'No se pudo eliminar el adjunto en ClickUp.' })
        setTimeout(() => setUploadMsg(null), 4000)
      }
    } catch {
      setUploadMsg({ ok: false, text: 'Error al intentar eliminar el adjunto.' })
      setTimeout(() => setUploadMsg(null), 4000)
    }
  }

  async function handleRefreshAll() {
    if (!ticket) return
    setRefreshing(true)
    try {
      const res = await fetch(`/api/clickup/tickets/${ticket.id}`)
      if (res.ok) {
        const data = await res.json()
        const atts = (data.ticket?.attachments ?? []).map((a: { uploadedAt: string } & Record<string, unknown>) => ({
          ...a, uploadedAt: new Date(a.uploadedAt),
        }))
        setLocalAttachments(atts)
      }
      refreshCommentsRef.current?.()
    } catch { /* silencioso */ }
    finally { setRefreshing(false) }
  }

  async function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (!file || !ticket) return
    const fakeEvent = { target: { files: [file], value: '' }, preventDefault: () => {} } as unknown as React.ChangeEvent<HTMLInputElement>
    await handleAttach(fakeEvent)
  }

  if (loading) {
    return (
      <div className="grid gap-4 h-full" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,380px)' }}>
        <div className="space-y-4">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-48 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-40 text-sm text-gray-400">
        Ticket no encontrado.
      </div>
    )
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,572px)', alignItems: 'start' }}
    >
      {/* ── LEFT: Ticket content ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{ticket.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRefreshAll}
                disabled={refreshing}
                title="Actualizar ticket"
                className="p-1.5 rounded-lg text-gray-400 hover:text-[#1B3A6B] hover:bg-gray-100 transition-colors disabled:opacity-40"
              >
                <svg className={refreshing ? 'animate-spin' : ''} xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
              </button>
              <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleAttach}
            />
          </div>
        </div>

        {/* Meta */}
        <div className="px-5 py-2 border-b border-gray-100">
          <MetaRow label="Asignado a">
            {ticket.assignees.length > 0
              ? <span className="font-medium">{ticket.assignees.join(', ')}</span>
              : <span className="text-gray-400 italic">Sin asignar</span>}
          </MetaRow>
          <MetaRow label="Creado por">
            <span>{ticket.createdBy}</span>
          </MetaRow>
          {ticket.watchers.length > 0 && (
            <MetaRow label="Seguidores">
              <span>{ticket.watchers.join(', ')}</span>
            </MetaRow>
          )}
          <MetaRow label="Creado">
            <span>{new Date(ticket.createdAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </MetaRow>
          <MetaRow label="Actualizado">
            <span>{new Date(ticket.updatedAt).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}</span>
          </MetaRow>
          {ticket.dueDate && (
            <MetaRow label="Vencimiento">
              <span className={new Date(ticket.dueDate) < new Date() ? 'text-red-500 font-medium' : ''}>
                {new Date(ticket.dueDate).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
            </MetaRow>
          )}
          {ticket.timeEstimate && (
            <MetaRow label="Estimado">
              <span>{Math.round(ticket.timeEstimate / 3600000 * 10) / 10}h</span>
            </MetaRow>
          )}
          {ticket.timeSpent != null && ticket.timeSpent > 0 && (
            <MetaRow label="Tiempo registrado">
              <span>{Math.round(ticket.timeSpent / 3600000 * 10) / 10}h</span>
            </MetaRow>
          )}
          {ticket.tags.length > 0 && (
            <MetaRow label="Etiquetas">
              <div className="flex flex-wrap gap-1">
                {ticket.tags.map(tag => (
                  <span key={tag} className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                ))}
              </div>
            </MetaRow>
          )}
        </div>

        {/* Description + Attachments */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {ticket.description ? (
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Descripción</p>
              <RichTextRenderer html={ticket.description} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin descripción.</p>
          )}
          {/* Attachments */}
          <div>
            {/* Header toolbar */}
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
                Adjuntos{localAttachments.length > 0 && <span className="ml-1 normal-case font-normal">{localAttachments.length}</span>}
              </p>
              <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg px-1.5 py-1">
                {/* Download all */}
                <button
                  title="Descargar todo"
                  onClick={async () => {
                    for (const a of localAttachments) {
                      try {
                        const proxyUrl = `/api/clickup/attachment?url=${encodeURIComponent(a.url)}`
                        const res = await fetch(proxyUrl)
                        const blob = await res.blob()
                        const blobUrl = URL.createObjectURL(blob)
                        const l = document.createElement('a')
                        l.href = blobUrl
                        l.download = a.name
                        document.body.appendChild(l)
                        l.click()
                        document.body.removeChild(l)
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000)
                      } catch { /* continuar con el siguiente */ }
                    }
                  }}
                  className="p-1 rounded text-gray-500 hover:text-[#1B3A6B] hover:bg-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                </button>
                {/* Grid view */}
                <button
                  title="Vista cuadrícula"
                  onClick={() => setAttViewMode('grid')}
                  className={`p-1 rounded transition-colors ${attViewMode === 'grid' ? 'text-[#1B3A6B] bg-white shadow-sm' : 'text-gray-500 hover:text-[#1B3A6B] hover:bg-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                </button>
                {/* List view */}
                <button
                  title="Vista lista"
                  onClick={() => setAttViewMode('list')}
                  className={`p-1 rounded transition-colors ${attViewMode === 'list' ? 'text-[#1B3A6B] bg-white shadow-sm' : 'text-gray-500 hover:text-[#1B3A6B] hover:bg-white'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                </button>
                {/* Add */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  title="Subir archivo"
                  className="p-1 rounded text-gray-500 hover:text-[#1B3A6B] hover:bg-white transition-colors disabled:opacity-40"
                >
                  {uploading
                    ? <svg className="animate-spin" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                    : <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }
                </button>
              </div>
              </div>
            </div>
            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`mb-3 flex items-center justify-center rounded-lg border border-dashed cursor-pointer py-2.5 text-xs transition-colors ${
                dragging ? 'border-[#1B3A6B] bg-blue-50 text-[#1B3A6B]' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500'
              }`}
            >
              Suelta tus archivos aquí para<span className="underline ml-1">subir</span>
            </div>
            {/* Attachments list/grid */}
            {localAttachments.length > 0 && (
              attViewMode === 'grid' ? (
                <div className="flex flex-wrap gap-1.5">
                  {localAttachments.map(att => (
                    <AttachmentCard
                      key={att.id}
                      att={att}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {localAttachments.map(att => (
                    <AttachmentCard
                      key={att.id}
                      att={att}
                      listMode
                    />
                  ))}
                </div>
              )
            )}
            {uploadMsg && (
              <p className={`text-xs mt-2 ${uploadMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{uploadMsg.text}</p>
            )}
          </div>
        </div>
      </div>

      {/* ── RIGHT: Comments ── */}
      <div
        className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden"
        style={{ height: 'calc(100vh - 140px)' }}
      >
        <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-700">Comentarios</h2>
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CommentTimeline
            ticketId={ticket.id}
            onImagesAttached={atts => setLocalAttachments(prev => [...atts, ...prev])}
            onRefreshReady={fn => { refreshCommentsRef.current = fn }}
          />
        </div>
      </div>
    </div>
  )
}

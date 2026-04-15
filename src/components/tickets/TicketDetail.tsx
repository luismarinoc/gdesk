// src/components/tickets/TicketDetail.tsx
'use client'

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

export function TicketDetail({ ticket, loading }: TicketDetailProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-4 h-full">
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
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-4 items-start min-h-0">
      {/* ── LEFT: Ticket content ── */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)' }}>
        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-3">
            <h1 className="text-lg font-bold text-gray-900 leading-snug">{ticket.title}</h1>
            <span className="text-xs text-gray-400 shrink-0 font-mono mt-0.5">{ticket.ticketNumber}</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <TicketStatusBadge status={ticket.status} />
            <TicketPriorityBadge priority={ticket.priority} />
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

        {/* Description */}
        <div className="flex-1 overflow-y-auto p-5">
          {ticket.description ? (
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wide mb-2">Descripción</p>
              <RichTextRenderer html={ticket.description} />
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">Sin descripción.</p>
          )}
        </div>
      </div>

      {/* ── RIGHT: Comments ── */}
      <div
        className="bg-white rounded-xl shadow-sm flex flex-col overflow-hidden"
        style={{ maxHeight: 'calc(100vh - 140px)' }}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">Comentarios</h2>
        </div>
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <CommentTimeline ticketId={ticket.id} />
        </div>
      </div>
    </div>
  )
}

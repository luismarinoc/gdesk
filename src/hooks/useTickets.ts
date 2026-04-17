// src/hooks/useTickets.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { GDeskTicket } from '@/types'

const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
export const ADMIN_LIST_KEY = 'gdesk_admin_list'

// In-flight dedup: evita que múltiples componentes disparen el mismo fetch simultáneamente
const inFlight: Map<string, Promise<GDeskTicket[]>> = new Map()

function cacheKey(listId?: string) {
  return listId ? `gdesk_tickets_${listId}` : 'gdesk_tickets_v1'
}

function parseTickets(raw: (GDeskTicket & { createdAt: string; updatedAt: string })[]): GDeskTicket[] {
  return raw.map(t => ({
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  }))
}

function readCache(listId?: string): GDeskTicket[] | null {
  if (typeof window === 'undefined') return null
  try {
    const s = sessionStorage.getItem(cacheKey(listId))
    if (!s) return null
    const { data, timestamp } = JSON.parse(s)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return parseTickets(data)
  } catch {
    return null
  }
}

function writeCache(tickets: GDeskTicket[], listId?: string) {
  try {
    sessionStorage.setItem(cacheKey(listId), JSON.stringify({ data: tickets, timestamp: Date.now() }))
  } catch {}
}

async function fetchFromApi(listId?: string): Promise<GDeskTicket[]> {
  const key = cacheKey(listId)

  // Si ya hay un fetch en vuelo para esta key, reutilizarlo
  const existing = inFlight.get(key)
  if (existing) return existing

  const url = listId ? `/api/clickup/tickets?listId=${listId}` : '/api/clickup/tickets'
  const promise = fetch(url, { cache: 'no-store' })
    .then(async res => {
      if (!res.ok) {
        try { sessionStorage.removeItem(key) } catch {}
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to fetch tickets')
      }
      const { tickets: raw } = await res.json()
      const parsed = parseTickets(raw)
      writeCache(parsed, listId)
      return parsed
    })
    .finally(() => inFlight.delete(key))

  inFlight.set(key, promise)
  return promise
}

export function useTickets(listId?: string) {
  const cached = useRef(readCache(listId))
  const [tickets, setTickets] = useState<GDeskTicket[]>(cached.current ?? [])
  const [loading, setLoading] = useState(!cached.current)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async (force = false) => {
    if (!force) {
      const hit = readCache(listId)
      if (hit) {
        setTickets(hit)
        setLoading(false)
        return // caché válido → no llama al API
      }
    }
    setLoading(true)
    setError(null)
    try {
      const parsed = await fetchFromApi(listId)
      setTickets(parsed)
    } catch (err) {
      setTickets([])
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [listId])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const refetch = useCallback(() => fetchTickets(true), [fetchTickets])

  return { tickets, loading, error, refetch }
}

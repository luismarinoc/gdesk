// src/hooks/useTickets.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import type { GDeskTicket } from '@/types'

const CACHE_KEY = 'gdesk_tickets_v1'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

function parseTickets(raw: (GDeskTicket & { createdAt: string; updatedAt: string })[]): GDeskTicket[] {
  return raw.map(t => ({
    ...t,
    createdAt: new Date(t.createdAt),
    updatedAt: new Date(t.updatedAt),
  }))
}

function readCache(): GDeskTicket[] | null {
  if (typeof window === 'undefined') return null
  try {
    const s = sessionStorage.getItem(CACHE_KEY)
    if (!s) return null
    const { data, timestamp } = JSON.parse(s)
    if (Date.now() - timestamp > CACHE_TTL) return null
    return parseTickets(data)
  } catch {
    return null
  }
}

function writeCache(tickets: GDeskTicket[]) {
  try {
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: tickets, timestamp: Date.now() }))
  } catch {}
}

export function useTickets() {
  const cached = useRef(readCache())
  const [tickets, setTickets] = useState<GDeskTicket[]>(cached.current ?? [])
  const [loading, setLoading] = useState(!cached.current)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async (force = false) => {
    if (!force) {
      const hit = readCache()
      if (hit) {
        setTickets(hit)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clickup/tickets', { cache: 'no-store' })
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const { tickets: raw } = await res.json()
      const parsed = parseTickets(raw)
      writeCache(parsed)
      setTickets(parsed)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  const refetch = useCallback(() => fetchTickets(true), [fetchTickets])

  return { tickets, loading, error, refetch }
}

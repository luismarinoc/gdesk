// src/hooks/useTickets.ts
import { useState, useEffect, useCallback } from 'react'
import type { GDeskTicket } from '@/types'

export function useTickets() {
  const [tickets, setTickets] = useState<GDeskTicket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchTickets = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/clickup/tickets')
      if (!res.ok) throw new Error('Failed to fetch tickets')
      const data = await res.json()
      setTickets(
        data.tickets.map((t: GDeskTicket & { createdAt: string; updatedAt: string }) => ({
          ...t,
          createdAt: new Date(t.createdAt),
          updatedAt: new Date(t.updatedAt),
        }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])

  return { tickets, loading, error, refetch: fetchTickets }
}

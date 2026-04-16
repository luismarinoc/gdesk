import { clickupClient } from '@/lib/clickup/client'
import { mapClickupTaskToTicket } from '@/lib/clickup/transformers'
import type { GDeskTicket } from '@/types'
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations/ticket.schema'

const DEFAULT_LIST_ID = process.env.CLICKUP_LIST_ID!

const PRIORITY_MAP: Record<string, number> = {
  urgent: 1,
  high: 2,
  normal: 3,
  low: 4,
}

const STATUS_MAP: Record<string, string> = {
  open: 'open',
  in_progress: 'in progress',
  resolved: 'resolved',
  closed: 'closed',
}

export async function listTickets(listId?: string): Promise<GDeskTicket[]> {
  const id = listId ?? DEFAULT_LIST_ID
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
  const since = sixMonthsAgo.getTime()

  const all: GDeskTicket[] = []
  let page = 0
  while (true) {
    const data = await clickupClient.get(
      `/list/${id}/task?include_closed=true&subtasks=true&date_created_gt=${since}&page=${page}`
    )
    const tasks = data.tasks ?? []
    all.push(...tasks.map(mapClickupTaskToTicket))
    if (data.last_page || tasks.length === 0) break
    page++
  }
  return all
}

export async function getTicket(id: string): Promise<GDeskTicket> {
  const data = await clickupClient.get(`/task/${id}`)
  return mapClickupTaskToTicket(data)
}

export async function createTicket(input: CreateTicketInput): Promise<GDeskTicket> {
  const typeLabel = input.type ? `[${input.type.toUpperCase()}]` : ''
  const moduleLabel = input.module ? ` [${input.module.toUpperCase()}]` : ''
  const data = await clickupClient.post(`/list/${LIST_ID}/task`, {
    name: `${typeLabel}${moduleLabel} ${input.title}`.trim(),
    description: input.description ?? '',
    priority: PRIORITY_MAP[input.priority ?? 'normal'],
    status: 'open',
  })
  return mapClickupTaskToTicket(data)
}

export async function updateTicket(id: string, input: UpdateTicketInput): Promise<GDeskTicket> {
  const body: Record<string, unknown> = {}
  if (input.title) body.name = input.title
  if (input.description !== undefined) body.description = input.description
  if (input.priority) body.priority = PRIORITY_MAP[input.priority]
  if (input.status) body.status = STATUS_MAP[input.status]
  if (input.assignedTo !== undefined) body.assignees = input.assignedTo ? [input.assignedTo] : []
  const data = await clickupClient.put(`/task/${id}`, body)
  return mapClickupTaskToTicket(data)
}

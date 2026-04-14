import { clickupClient } from '@/lib/clickup/client'
import { mapClickupTaskToTicket } from '@/lib/clickup/transformers'
import type { GDeskTicket } from '@/types'
import type { CreateTicketInput, UpdateTicketInput } from '@/lib/validations/ticket.schema'

const LIST_ID = process.env.CLICKUP_LIST_ID!

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

export async function listTickets(): Promise<GDeskTicket[]> {
  const data = await clickupClient.get(`/list/${LIST_ID}/task?include_closed=true`)
  return (data.tasks ?? []).map(mapClickupTaskToTicket)
}

export async function getTicket(id: string): Promise<GDeskTicket> {
  const data = await clickupClient.get(`/task/${id}`)
  return mapClickupTaskToTicket(data)
}

export async function createTicket(input: CreateTicketInput): Promise<GDeskTicket> {
  const data = await clickupClient.post(`/list/${LIST_ID}/task`, {
    name: input.title,
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

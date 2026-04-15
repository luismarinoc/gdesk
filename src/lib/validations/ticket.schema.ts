import { z } from 'zod'

export const createTicketSchema = z.object({
  type: z.enum(['bug', 'consulta', 'cambio', 'acceso', 'otro']).default('consulta'),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres').max(200),
  description: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).default('normal'),
  module: z.string().min(1, 'Selecciona un módulo'),
})

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().optional(),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).optional(),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  assignedTo: z.string().nullable().optional(),
})

export type CreateTicketInput = z.infer<typeof createTicketSchema>
export type UpdateTicketInput = z.infer<typeof updateTicketSchema>

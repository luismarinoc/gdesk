import { describe, it, expect } from 'vitest'
import { canViewAllTickets, canEditTicket, canManageUsers } from '@/lib/auth/permissions'

describe('permissions', () => {
  it('admin can view all tickets', () => {
    expect(canViewAllTickets('admin')).toBe(true)
  })
  it('agent can view all tickets', () => {
    expect(canViewAllTickets('agent')).toBe(true)
  })
  it('client cannot view all tickets', () => {
    expect(canViewAllTickets('client')).toBe(false)
  })
  it('admin can edit any ticket', () => {
    expect(canEditTicket('admin')).toBe(true)
  })
  it('agent can edit any ticket', () => {
    expect(canEditTicket('agent')).toBe(true)
  })
  it('client cannot edit tickets', () => {
    expect(canEditTicket('client')).toBe(false)
  })
  it('only admin can manage users', () => {
    expect(canManageUsers('admin')).toBe(true)
    expect(canManageUsers('agent')).toBe(false)
    expect(canManageUsers('client')).toBe(false)
  })
})

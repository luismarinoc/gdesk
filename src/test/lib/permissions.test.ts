import { describe, it, expect } from 'vitest'
import {
  canViewAllTickets,
  canEditTicket,
  canManageUsers,
  canAssignAgent,
  canChangeStatus,
} from '@/lib/auth/permissions'

describe('canViewAllTickets', () => {
  it('admin can view all tickets', () => expect(canViewAllTickets('admin')).toBe(true))
  it('agent can view all tickets', () => expect(canViewAllTickets('agent')).toBe(true))
  it('client cannot view all tickets', () => expect(canViewAllTickets('client')).toBe(false))
})

describe('canEditTicket', () => {
  it('admin can edit any ticket', () => expect(canEditTicket('admin')).toBe(true))
  it('agent can edit any ticket', () => expect(canEditTicket('agent')).toBe(true))
  it('client cannot edit tickets', () => expect(canEditTicket('client')).toBe(false))
})

describe('canManageUsers', () => {
  it('admin can manage users', () => expect(canManageUsers('admin')).toBe(true))
  it('agent cannot manage users', () => expect(canManageUsers('agent')).toBe(false))
  it('client cannot manage users', () => expect(canManageUsers('client')).toBe(false))
})

describe('canAssignAgent', () => {
  it('admin can assign agent', () => expect(canAssignAgent('admin')).toBe(true))
  it('agent can assign agent', () => expect(canAssignAgent('agent')).toBe(true))
  it('client cannot assign agent', () => expect(canAssignAgent('client')).toBe(false))
})

describe('canChangeStatus', () => {
  it('admin can change status', () => expect(canChangeStatus('admin')).toBe(true))
  it('agent can change status', () => expect(canChangeStatus('agent')).toBe(true))
  it('client cannot change status', () => expect(canChangeStatus('client')).toBe(false))
})

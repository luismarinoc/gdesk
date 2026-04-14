import { describe, it, expect } from 'vitest'
import { clickupStatusToGDesk, clickupPriorityToGDesk, mapClickupTaskToTicket } from '@/lib/clickup/transformers'

describe('clickupStatusToGDesk', () => {
  it('maps "open" to open', () => {
    expect(clickupStatusToGDesk('open')).toBe('open')
  })
  it('maps "in progress" to in_progress', () => {
    expect(clickupStatusToGDesk('in progress')).toBe('in_progress')
  })
  it('maps "resolved" to resolved', () => {
    expect(clickupStatusToGDesk('resolved')).toBe('resolved')
  })
  it('maps "closed" to closed', () => {
    expect(clickupStatusToGDesk('closed')).toBe('closed')
  })
  it('maps unknown to open', () => {
    expect(clickupStatusToGDesk('something else')).toBe('open')
  })
})

describe('clickupPriorityToGDesk', () => {
  it('maps priority 1 to urgent', () => {
    expect(clickupPriorityToGDesk(1)).toBe('urgent')
  })
  it('maps priority 2 to high', () => {
    expect(clickupPriorityToGDesk(2)).toBe('high')
  })
  it('maps priority 3 to normal', () => {
    expect(clickupPriorityToGDesk(3)).toBe('normal')
  })
  it('maps priority 4 to low', () => {
    expect(clickupPriorityToGDesk(4)).toBe('low')
  })
  it('maps null to normal', () => {
    expect(clickupPriorityToGDesk(null)).toBe('normal')
  })
})

describe('mapClickupTaskToTicket', () => {
  it('maps a ClickUp task to GDeskTicket shape', () => {
    const task = {
      id: 'abc123',
      custom_id: 'TICK-1',
      name: 'Test ticket',
      description: '<p>Hello</p>',
      status: { status: 'open' },
      priority: { priority: 3 },
      date_created: '1700000000000',
      date_updated: '1700000001000',
      creator: { username: 'alice' },
      assignees: [{ username: 'bob' }],
    }
    const result = mapClickupTaskToTicket(task)
    expect(result.id).toBe('abc123')
    expect(result.ticketNumber).toBe('TICK-1')
    expect(result.title).toBe('Test ticket')
    expect(result.status).toBe('open')
    expect(result.priority).toBe('normal')
    expect(result.assignedTo).toBe('bob')
    expect(result.createdBy).toBe('alice')
  })
})

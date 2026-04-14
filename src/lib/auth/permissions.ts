export type UserRole = 'admin' | 'agent' | 'client'

export function canViewAllTickets(role: UserRole): boolean {
  return role === 'admin' || role === 'agent'
}

export function canEditTicket(role: UserRole): boolean {
  return role === 'admin' || role === 'agent'
}

export function canManageUsers(role: UserRole): boolean {
  return role === 'admin'
}

export function canAssignAgent(role: UserRole): boolean {
  return role === 'admin' || role === 'agent'
}

export function canChangeStatus(role: UserRole): boolean {
  return role === 'admin' || role === 'agent'
}

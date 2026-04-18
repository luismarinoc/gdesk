'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard, Ticket, Users, Settings,
  ChevronDown, ChevronRight, TicketCheck,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  locale: string
  userRole: string
  userFullName: string
  permissions: string[]
  onClose?: () => void
}

export function Sidebar({ locale, userRole, userFullName, permissions, onClose }: SidebarProps) {
  const can = (module: string) => userRole === 'admin' || permissions.includes(module)
  const pathname = usePathname()
  const [dashOpen, setDashOpen] = useState(true)

  const initials = userFullName
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LM'

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/')

  const subItem = (href: string, label: string) => {
    const active = isActive(href)
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'block py-1.5 px-2 text-[12.5px] transition-colors rounded-md',
          active
            ? 'text-[#93C5FD] font-semibold'
            : 'text-white/50 hover:text-white/90 hover:bg-white/5'
        )}
      >
        {label}
      </Link>
    )
  }

  const navItem = (
    href: string,
    icon: React.ReactNode,
    label: string,
    hasChildren = false,
    open = false,
    toggle?: () => void,
    exact = false
  ) => {
    const active = isActive(href, exact)
    if (hasChildren && toggle) {
      return (
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all',
            active
              ? 'bg-white text-[#2457a8] font-semibold shadow-sm'
              : 'text-white/70 hover:bg-white/10 hover:text-white'
          )}
        >
          <span className={cn('flex-shrink-0', active ? 'text-[#2457a8]' : 'text-white/60')}>{icon}</span>
          <span className="flex-1 text-left">{label}</span>
          {open
            ? <ChevronDown className={cn('w-3.5 h-3.5', active ? 'text-[#2457a8]/50' : 'text-white/30')} />
            : <ChevronRight className={cn('w-3.5 h-3.5', active ? 'text-[#2457a8]/50' : 'text-white/30')} />}
        </button>
      )
    }
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-medium transition-all',
          active
            ? 'bg-white text-[#2457a8] font-semibold shadow-sm'
            : 'text-white/70 hover:bg-white/10 hover:text-white'
        )}
      >
        <span className={cn('flex-shrink-0', active ? 'text-[#2457a8]' : 'text-white/60')}>{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <aside
      className="flex flex-col bg-[#2457a8] border-r border-white/10"
      style={{ width: '240px', minHeight: '100vh', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-5 pt-5 pb-4 border-b border-white/10">
        <Link href={`/${locale}/dashboard`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-gpartner.png"
            alt="GPartner Consulting"
            style={{ width: '190px', height: 'auto', filter: 'brightness(0) invert(1)' }}
            className="cursor-pointer hover:opacity-80 transition-opacity"
          />
        </Link>
      </div>

      {/* User profile */}
      <div className="flex items-center gap-2.5 px-4 py-3 mx-3 mt-3 mb-1 rounded-xl bg-white/10">
        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-white truncate">{userFullName}</div>
          <div className="text-[10px] text-white/45">
            {userRole === 'admin' ? 'Administrador' : userRole === 'agent' ? 'Agente' : 'Cliente'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5 mt-2">

        <p className="text-[10px] font-semibold text-white/30 uppercase tracking-widest px-3 pt-2 pb-1.5">
          Menú Principal
        </p>

        {(can('dashboard') || can('kanban') || can('reports') || can('workload')) &&
          navItem(`/${locale}/dashboard`, <LayoutDashboard className="w-4 h-4" />, 'Dashboard', true, dashOpen, () => setDashOpen(v => !v))}

        {(can('dashboard') || can('kanban') || can('reports') || can('workload')) && dashOpen && (
          <div className="ml-6 border-l border-white/10 pl-3 space-y-0.5 mb-1">
            {can('dashboard') && subItem(`/${locale}/dashboard`, 'Overview')}
            {can('kanban') && subItem(`/${locale}/kanban`, 'Kanban')}
            {can('reports') && subItem(`/${locale}/reports`, 'Reportes')}
            {can('workload') && subItem(`/${locale}/workload`, 'Carga de Trabajo')}
          </div>
        )}

        {can('tickets') && navItem(`/${locale}/tickets`, <TicketCheck className="w-4 h-4" />, 'Gestión de Tickets')}
        {userRole !== 'agent' && can('tickets') && navItem(`/${locale}/tickets/new`, <Ticket className="w-4 h-4" />, 'Nueva Solicitud', false, false, undefined, true)}
        {userRole === 'admin' && navItem(`/${locale}/users`, <Users className="w-4 h-4" />, 'Usuarios')}
        {navItem(`/${locale}/settings`, <Settings className="w-4 h-4" />, 'Configuración')}

      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/10">
        <p className="text-[11px] text-white/20 text-center">GDesk v1.0 · GPartner Consulting</p>
      </div>
    </aside>
  )
}

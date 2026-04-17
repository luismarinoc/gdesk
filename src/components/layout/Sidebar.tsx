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
}

export function Sidebar({ locale, userRole, userFullName, permissions }: SidebarProps) {
  const can = (module: string) => userRole === 'admin' || permissions.includes(module)
  const pathname = usePathname()
  const [dashOpen, setDashOpen] = useState(true)

  const initials = userFullName
    .split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'LM'

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  const subItem = (href: string, label: string) => (
    <Link
      href={href}
      className={cn(
        'block py-1.5 px-3 text-[13px] transition-colors rounded',
        isActive(href)
          ? 'text-[#1B3A6B] font-semibold'
          : 'text-gray-500 hover:text-gray-800'
      )}
    >
      {label}
    </Link>
  )

  const navItem = (
    href: string,
    icon: React.ReactNode,
    label: string,
    hasChildren = false,
    open = false,
    toggle?: () => void
  ) => {
    const active = isActive(href)
    if (hasChildren && toggle) {
      return (
        <button
          onClick={toggle}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
            active ? 'text-[#1B3A6B]' : 'text-gray-600 hover:text-gray-900'
          )}
        >
          <span className={cn('flex-shrink-0', active ? 'text-[#1B3A6B]' : 'text-gray-400')}>{icon}</span>
          <span className="flex-1 text-left">{label}</span>
          {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
        </button>
      )
    }
    return (
      <Link
        href={href}
        className={cn(
          'flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
          active ? 'text-[#1B3A6B]' : 'text-gray-600 hover:text-gray-900'
        )}
      >
        <span className={cn('flex-shrink-0', active ? 'text-[#1B3A6B]' : 'text-gray-400')}>{icon}</span>
        {label}
      </Link>
    )
  }

  return (
    <aside
      className="flex flex-col bg-white border-r border-gray-100"
      style={{ width: '240px', minHeight: '100vh', flexShrink: 0 }}
    >
      {/* Logo */}
      <div className="flex items-center justify-center px-5 pt-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-gpartner.png"
          alt="GPartner Consulting"
          style={{ width: '160px', height: 'auto' }}
        />
      </div>

      {/* User profile */}
      <div className="flex items-center gap-2.5 px-4 py-3 mx-3 mb-3 rounded-xl bg-gray-50">
        <div className="w-9 h-9 rounded-full bg-[#1B3A6B] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initials}</span>
        </div>
        <div className="min-w-0">
          <div className="text-[13px] font-semibold text-gray-800 truncate">{userFullName}</div>
          <div className="text-[11px] text-gray-400">
            {userRole === 'admin' ? 'Administrador' : userRole === 'agent' ? 'Agente' : 'Cliente'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 overflow-y-auto space-y-0.5">

        {/* MENÚ PRINCIPAL */}
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 pt-2 pb-1">
          Menú Principal
        </p>

        {/* Dashboard expandible */}
        {can('dashboard') && navItem(`/${locale}/dashboard`, <LayoutDashboard className="w-4 h-4" />, 'Dashboard', true, dashOpen, () => setDashOpen(v => !v))}
        {can('dashboard') && dashOpen && (
          <div className="ml-6 border-l border-gray-100 pl-3 space-y-0.5 mb-1">
            {subItem(`/${locale}/dashboard`, 'Overview')}
            {subItem(`/${locale}/kanban`, 'Kanban')}
            {subItem(`/${locale}/reports`, 'Reportes')}
            {subItem(`/${locale}/workload`, 'Carga de Trabajo')}
          </div>
        )}

        {/* Gestión de Tickets */}
        {can('tickets') && navItem(`/${locale}/tickets`, <TicketCheck className="w-4 h-4" />, 'Gestión de Tickets')}

        {/* Nueva Solicitud */}
        {can('tickets') && navItem(`/${locale}/tickets/new`, <Ticket className="w-4 h-4" />, 'Nueva Solicitud')}

        {/* Usuarios (admin) */}
        {userRole === 'admin' && navItem(`/${locale}/users`, <Users className="w-4 h-4" />, 'Usuarios')}

        {/* Configuración */}
        {navItem(`/${locale}/settings`, <Settings className="w-4 h-4" />, 'Configuración')}

      </nav>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-gray-100">
        <p className="text-[11px] text-gray-300 text-center">GDesk v1.0 · GPartner Consulting</p>
      </div>
    </aside>
  )
}

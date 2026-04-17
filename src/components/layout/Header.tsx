'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useState, useCallback, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PanelLeftClose, PanelLeftOpen, Search, Bell, RefreshCw } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTickets } from '@/hooks/useTickets'
import { TicketStatusBadge } from '@/components/tickets/TicketStatusBadge'

interface HeaderProps {
  locale: string
  userFullName: string
  sidebarOpen?: boolean
  onToggleSidebar?: () => void
}

export function Header({ locale, userFullName, sidebarOpen, onToggleSidebar }: HeaderProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [notifications] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [searchValue, setSearchValue] = useState(searchParams.get('q') ?? '')
  const [showDropdown, setShowDropdown] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const searchRef = useRef<HTMLDivElement>(null)

  const { tickets } = useTickets()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    setSearchValue(searchParams.get('q') ?? '')
  }, [searchParams])

  // Filter tickets for dropdown
  const q = searchValue.trim().toLowerCase()
  const dropdownResults = q.length >= 2
    ? tickets.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.ticketNumber.toLowerCase().includes(q) ||
        (t.assignedTo ?? '').toLowerCase().includes(q) ||
        t.createdBy.toLowerCase().includes(q)
      ).slice(0, 8)
    : []

  const isKanban = pathname.includes('/kanban')

  const handleSearch = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setSearchValue(val)
    setShowDropdown(!isKanban)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())
      if (val.trim()) {
        params.set('q', val.trim())
      } else {
        params.delete('q')
      }
      router.push(`${pathname}?${params.toString()}`)
    }, 300)
  }, [pathname, router, searchParams])

  function handleSelectTicket(id: string) {
    setShowDropdown(false)
    setSearchValue('')
    router.push(`/${locale}/tickets/${id}`)
  }

  async function handleRefresh() {
    setRefreshing(true)
    try {
      await fetch('/api/clickup/tickets/revalidate', { method: 'POST' })
      sessionStorage.removeItem('gdesk_tickets_v1')
      router.refresh()
    } finally {
      setRefreshing(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  function handleLocaleChange(newLocale: string) {
    const path = window.location.pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(path)
  }

  const initials =
    userFullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2) || '?'

  return (
    <header className="h-14 bg-white border-b border-gray-100 sticky top-0 z-10 flex items-center px-6 gap-4">
      <button
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Ocultar menú' : 'Mostrar menú'}
        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
      >
        {sidebarOpen
          ? <PanelLeftClose className="w-5 h-5" />
          : <PanelLeftOpen className="w-5 h-5" />
        }
      </button>

      {/* Search with dropdown */}
      <div className="flex-1 max-w-md relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchValue}
            onChange={handleSearch}
            onFocus={() => q.length >= 2 && !isKanban && setShowDropdown(true)}
            placeholder="Buscar tickets..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 rounded-lg text-sm text-gray-700 placeholder-gray-400 outline-none focus:bg-gray-100 transition-colors border-0"
          />
          {searchValue && (
            <button
              onClick={() => {
              setSearchValue('')
              setShowDropdown(false)
              const params = new URLSearchParams(searchParams.toString())
              params.delete('q')
              router.push(`${pathname}?${params.toString()}`)
            }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
        </div>

        {/* Results dropdown */}
        {showDropdown && dropdownResults.length > 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
            {dropdownResults.map((ticket) => (
              <button
                key={ticket.id}
                onMouseDown={() => handleSelectTicket(ticket.id)}
                className="w-full flex items-start gap-3 px-4 py-2.5 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{ticket.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-400">#{ticket.ticketNumber}</span>
                    <TicketStatusBadge status={ticket.status} />
                  </div>
                </div>
                {ticket.assignedTo && (
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">{ticket.assignedTo}</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {showDropdown && q.length >= 2 && dropdownResults.length === 0 && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg z-50 px-4 py-3 text-sm text-gray-400 text-center">
            Sin resultados para &ldquo;{searchValue}&rdquo;
          </div>
        )}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden text-xs font-semibold">
          <button
            onClick={() => handleLocaleChange('es')}
            className={locale === 'es' ? 'px-2.5 py-1.5 bg-[#1B3A6B] text-white' : 'px-2.5 py-1.5 text-gray-500 hover:bg-gray-50'}
          >ES</button>
          <button
            onClick={() => handleLocaleChange('en')}
            className={locale === 'en' ? 'px-2.5 py-1.5 bg-[#1B3A6B] text-white' : 'px-2.5 py-1.5 text-gray-500 hover:bg-gray-50'}
          >EN</button>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing}
          title="Actualizar datos"
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>

        <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-50">
          <Bell className="w-5 h-5" />
          {notifications > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {notifications}
            </span>
          )}
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="w-8 h-8 rounded-full bg-[#1B3A6B] flex items-center justify-center">
              <span className="text-white text-xs font-semibold">{initials}</span>
            </div>
            <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[120px] truncate">
              {userFullName}
            </span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-gray-800 truncate">{userFullName}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
              {t('logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { TicketIcon, Settings, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  locale: string
  userRole: string
}

export function Sidebar({ locale, userRole }: SidebarProps) {
  const t = useTranslations('nav')
  const pathname = usePathname()

  const links = [
    { href: `/${locale}/tickets`, label: t('tickets'), icon: TicketIcon },
    { href: `/${locale}/settings`, label: t('settings'), icon: Settings },
    ...(userRole === 'admin'
      ? [{ href: `/${locale}/users`, label: t('users'), icon: Users }]
      : []),
  ]

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 text-xl font-bold border-b border-gray-700">
        GDesk
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
              pathname.startsWith(href)
                ? 'bg-blue-600 text-white'
                : 'text-gray-300 hover:bg-gray-700'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}

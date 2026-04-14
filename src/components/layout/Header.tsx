'use client'

import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  locale: string
  userFullName: string
}

export function Header({ locale, userFullName }: HeaderProps) {
  const t = useTranslations('nav')
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push(`/${locale}/login`)
    router.refresh()
  }

  function handleLocaleChange(newLocale: string) {
    const path = window.location.pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(path)
  }

  const initials = userFullName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  return (
    <header className="h-14 border-b flex items-center justify-between px-6 bg-white">
      <div />
      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger className="px-2 py-1 text-sm rounded hover:bg-gray-100 transition-colors">
            {locale.toUpperCase()}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleLocaleChange('es')}>ES</DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleLocaleChange('en')}>EN</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-300 transition-colors">
            {initials}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>{t('logout')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}

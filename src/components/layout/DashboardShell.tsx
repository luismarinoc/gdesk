'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardShellProps {
  locale: string
  userFullName: string
  userRole: string
  children: React.ReactNode
}

export function DashboardShell({ locale, userFullName, userRole, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Persist preference
  useEffect(() => {
    const stored = localStorage.getItem('gdesk_sidebar')
    if (stored !== null) setSidebarOpen(stored === 'true')
  }, [])

  function toggleSidebar() {
    setSidebarOpen(prev => {
      localStorage.setItem('gdesk_sidebar', String(!prev))
      return !prev
    })
  }

  return (
    <div className="flex min-h-screen bg-[#F7F9FB]">
      {sidebarOpen && (
        <Sidebar locale={locale} userRole={userRole} userFullName={userFullName} />
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          locale={locale}
          userFullName={userFullName}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface DashboardShellProps {
  locale: string
  userFullName: string
  userRole: string
  permissions: string[]
  children: React.ReactNode
}

export function DashboardShell({ locale, userFullName, userRole, permissions, children }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    function check() {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (mobile) setSidebarOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Persist desktop preference only
  useEffect(() => {
    if (isMobile) return
    const stored = localStorage.getItem('gdesk_sidebar')
    if (stored !== null) setSidebarOpen(stored === 'true')
  }, [isMobile])

  function toggleSidebar() {
    setSidebarOpen(prev => {
      if (!isMobile) localStorage.setItem('gdesk_sidebar', String(!prev))
      return !prev
    })
  }

  return (
    <div className="dashboard-root flex min-h-screen bg-[#F7F9FB] relative">
      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      {sidebarOpen && (
        <div className={isMobile ? 'fixed inset-y-0 left-0 z-50' : ''}>
          <Sidebar
            locale={locale}
            userRole={userRole}
            userFullName={userFullName}
            permissions={permissions}
            onClose={isMobile ? () => setSidebarOpen(false) : undefined}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Header
          locale={locale}
          userFullName={userFullName}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

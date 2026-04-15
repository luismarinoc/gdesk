'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

interface MonthSelectProps {
  value?: string
}

export function MonthSelect({ value: valueProp }: MonthSelectProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const value = valueProp ?? searchParams.get('month') ?? 'all'

  const now = new Date()
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleString('es', { month: 'long', year: 'numeric' }),
    }
  }).reverse()

  const handleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams(searchParams.toString())
    if (e.target.value === 'all') {
      params.delete('month')
    } else {
      params.set('month', e.target.value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  return (
    <select
      value={value}
      onChange={handleChange}
      className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#1B3A6B]/20 cursor-pointer capitalize"
    >
      <option value="all">Todos los meses</option>
      {months.map(m => (
        <option key={m.value} value={m.value} className="capitalize">{m.label}</option>
      ))}
    </select>
  )
}

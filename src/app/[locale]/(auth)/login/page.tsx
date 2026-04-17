'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const t = useTranslations('auth')
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(t('loginError'))
      setLoading(false)
      return
    }
    // Redirect to first permitted route
    const me = await fetch('/api/auth/me').then(r => r.json())
    const role  = me.user?.role ?? 'client'
    const perms: string[] = me.user?.permissions ?? []
    const route =
      role === 'admin'               ? 'dashboard' :
      perms.includes('dashboard')    ? 'dashboard' :
      perms.includes('kanban')       ? 'kanban'    :
      perms.includes('reports')      ? 'reports'   :
      perms.includes('workload')     ? 'workload'  :
      'tickets'
    router.push(`/${locale}/${route}`)
    router.refresh()
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ backgroundImage: 'url(/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        {/* Overlay para legibilidad del texto */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d254799 0%, #1B3A6Bbb 50%, #0e6e6e99 100%)' }} />

        <div className="relative z-10">
          <Image src="/logo-gpartner.png" alt="GPartner Consulting" width={240} height={80} className="brightness-0 invert" />
        </div>

        <div className="relative z-10 space-y-4">
          <p className="text-xs font-semibold tracking-widest text-teal-300 uppercase">Portal de soporte</p>
          <h1 className="text-4xl font-bold text-white leading-tight">
            Gestiona tus<br />tickets de soporte
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Accede a tu portal de atención al cliente de GPartner Consulting.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          <span className="text-blue-300 text-xs">gpartnerc.com</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Image src="/logo-gpartner.png" alt="GPartner Consulting" width={150} height={50} />
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">Bienvenido</h2>
            <p className="text-sm text-gray-500 mt-1">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                {t('email')}
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="correo@empresa.com"
                className="h-11 bg-white border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                {t('password')}
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-11 bg-white border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60"
              style={{ background: loading ? '#1B3A6B99' : 'linear-gradient(135deg, #1B3A6B, #0e6e6e)' }}
            >
              {loading ? 'Ingresando...' : t('login')}
            </button>

            <p className="text-sm text-center text-gray-500">
              {t('noAccount')}{' '}
              <Link href={`/${locale}/register`} className="font-medium text-[#1B3A6B] hover:underline">
                {t('register')}
              </Link>
            </p>
          </form>
        </div>

        <p className="mt-12 text-xs text-gray-400">© {new Date().getFullYear()} GPartner Consulting</p>
      </div>
    </div>
  )
}

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
            Resuelve incidentes<br />en minutos, no días
          </h1>
          <p className="text-blue-200 text-sm leading-relaxed max-w-xs">
            Portal exclusivo de atención al cliente de GPartner Consulting. Seguimiento en tiempo real de cada solicitud.
          </p>
          <div className="pt-2 space-y-2">
            <div className="flex items-center gap-2 text-blue-100 text-xs">
              <div className="w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
              Soporte dedicado en módulos SAP
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-xs">
              <div className="w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
              Historial completo de tickets
            </div>
            <div className="flex items-center gap-2 text-blue-100 text-xs">
              <div className="w-1 h-1 rounded-full bg-teal-400 flex-shrink-0" />
              Acceso seguro con cifrado SSL
            </div>
          </div>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  {t('password')}
                </Label>
                <Link href={`/${locale}/forgot-password`} className="text-xs text-[#1B3A6B] hover:underline">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
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
              className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #1B3A6B, #0e6e6e)' }}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verificando...
                </>
              ) : t('login')}
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

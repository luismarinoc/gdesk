'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function ResetPasswordPage({ params }: { params: Promise<{ locale: string }> }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [exchanging, setExchanging] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [locale, setLocale] = useState('es')

  useEffect(() => {
    params.then(p => setLocale(p.locale))
  }, [params])

  // Intercambiar el código PKCE al cargar la página
  useEffect(() => {
    const code = searchParams.get('code')
    if (!code) {
      setError('Enlace inválido o expirado. Solicita uno nuevo.')
      setExchanging(false)
      return
    }
    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setError('El enlace expiró o ya fue usado. Solicita uno nuevo.')
      }
      setExchanging(false)
    })
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const rules = [
    { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
    { label: 'Una mayúscula (A-Z)', valid: /[A-Z]/.test(password) },
    { label: 'Un número (0-9)', valid: /[0-9]/.test(password) },
  ]
  const allValid = rules.every(r => r.valid)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!allValid) return
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError('No se pudo actualizar la contraseña. Solicita un nuevo enlace.')
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push(`/${locale}/login`), 2000)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ backgroundImage: 'url(/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d2547cc 0%, #1B3A6Bdd 50%, #0e6e6ecc 100%)' }} />

      <div className="relative z-10 mb-8">
        <Image src="/logo-gpartner.png" alt="GPartner Consulting" width={240} height={80} className="brightness-0 invert" />
      </div>

      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        {exchanging ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <svg className="animate-spin h-8 w-8 text-[#1B3A6B]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Verificando enlace...</p>
          </div>
        ) : success ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0e6e6e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Contraseña actualizada</h2>
            <p className="text-sm text-gray-500">Redirigiendo al inicio de sesión...</p>
          </div>
        ) : error && !password ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">Enlace inválido</h2>
            <p className="text-sm text-gray-500">{error}</p>
            <Link href={`/${locale}/forgot-password`} className="block text-sm font-medium text-[#1B3A6B] hover:underline">
              Solicitar nuevo enlace
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Nueva contraseña</h2>
              <p className="text-sm text-gray-500 mt-1">Elige una contraseña segura para tu cuenta.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">Nueva contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-11 bg-gray-50 border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
                />
                {password.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {rules.map(r => (
                      <li key={r.label} className={`flex items-center gap-1.5 text-xs ${r.valid ? 'text-teal-600' : 'text-gray-400'}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          {r.valid ? <polyline points="20 6 9 17 4 12" /> : <line x1="18" y1="6" x2="6" y2="18" />}
                        </svg>
                        {r.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirm" className="text-sm font-medium text-gray-700">Confirmar contraseña</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="h-11 bg-gray-50 border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allValid}
                className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #1B3A6B, #0e6e6e)' }}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Guardando...
                  </>
                ) : 'Guardar nueva contraseña'}
              </button>

              <p className="text-sm text-center text-gray-500">
                <Link href={`/${locale}/login`} className="font-medium text-[#1B3A6B] hover:underline">
                  ← Volver al inicio de sesión
                </Link>
              </p>
            </form>
          </>
        )}
      </div>

      <p className="relative z-10 mt-6 text-xs text-blue-200">© {new Date().getFullYear()} GPartner Consulting</p>
    </div>
  )
}

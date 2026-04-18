'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import Image from 'next/image'

export default function RegisterPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, fullName }),
    })
    const json = await res.json()

    if (!res.ok) {
      setError(json.error ?? 'Error al registrar usuario')
      setLoading(false)
      return
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError('Cuenta creada. Por favor inicia sesión.')
      setLoading(false)
      router.push(`/${locale}/login`)
      return
    }

    setSuccess(`Cuenta creada como ${json.role === 'agent' ? 'Agente' : 'Cliente'}. Redirigiendo...`)
    setTimeout(() => {
      router.push(`/${locale}/dashboard`)
      router.refresh()
    }, 1000)
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative"
      style={{ backgroundImage: 'url(/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #0d2547cc 0%, #1B3A6Bdd 50%, #0e6e6ecc 100%)' }} />

      {/* Logo arriba */}
      <div className="relative z-10 mb-8">
        <Image src="/logo-gpartner.png" alt="GPartner Consulting" width={240} height={80} className="brightness-0 invert" />
      </div>

      {/* Card centrada */}
      <div className="relative z-10 w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Crear cuenta</h2>
          <p className="text-sm text-gray-500 mt-1">
            Correos <span className="font-medium text-[#1B3A6B]">@gpartnerc.com</span> se registran como Agente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nombre completo</Label>
            <Input
              id="name"
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              autoComplete="name"
              placeholder="Ej: Juan Pérez"
              className="h-11 bg-gray-50 border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="correo@empresa.com"
              className="h-11 bg-gray-50 border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">Contraseña</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="h-11 bg-gray-50 border-gray-200 focus:border-[#1B3A6B] focus:ring-[#1B3A6B]"
            />
            {password.length > 0 && (
              <ul className="space-y-1 mt-1">
                {[
                  { label: 'Mínimo 8 caracteres', valid: password.length >= 8 },
                  { label: 'Una mayúscula (A-Z)', valid: /[A-Z]/.test(password) },
                  { label: 'Un número (0-9)', valid: /[0-9]/.test(password) },
                ].map(r => (
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

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500 flex-shrink-0">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-100 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 flex-shrink-0">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-60 mt-2"
            style={{ background: loading ? '#1B3A6B99' : 'linear-gradient(135deg, #1B3A6B, #0e6e6e)' }}
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>

          <p className="text-sm text-center text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href={`/${locale}/login`} className="font-medium text-[#1B3A6B] hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      </div>

      <p className="relative z-10 mt-6 text-xs text-blue-200">© {new Date().getFullYear()} GPartner Consulting</p>
    </div>
  )
}

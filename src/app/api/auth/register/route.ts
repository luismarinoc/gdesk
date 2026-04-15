import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const { email, password, fullName } = await req.json()

  if (!email || !password || !fullName) {
    return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 })
  }

  const role = email.toLowerCase().endsWith('@gpartnerc.com') ? 'agent' : 'client'

  // Create auth user (email_confirm:true skips confirmation email)
  const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  })

  if (authError || !authData.user) {
    const msg = authError?.message ?? 'Error al crear usuario'
    const isDuplicate = msg.toLowerCase().includes('already')
    return NextResponse.json(
      { error: isDuplicate ? 'El correo ya está registrado' : msg },
      { status: 400 }
    )
  }

  // Create profile with correct role
  const { error: profileError } = await adminClient.from('user_profiles').upsert({
    id: authData.user.id,
    full_name: fullName,
    role,
    locale: 'es',
  })

  if (profileError) {
    // Rollback auth user
    await adminClient.auth.admin.deleteUser(authData.user.id)
    return NextResponse.json({ error: 'Error al crear perfil de usuario' }, { status: 500 })
  }

  return NextResponse.json({ success: true, role })
}

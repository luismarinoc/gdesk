// src/app/api/clickup/attachments/[attId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clickupClient } from '@/lib/clickup/client'

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ attId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { attId } = await params

  try {
    await clickupClient.delete(`/attachment/${attId}`)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const msg = String(err)
    // Si no existe, igual lo consideramos exitoso
    if (msg.includes('404') || msg.includes('not found')) {
      return NextResponse.json({ ok: true, notFound: true })
    }
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

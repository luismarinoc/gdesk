// src/app/api/clickup/tickets/[id]/attachments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clickupClient } from '@/lib/clickup/client'

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const fromUrl = formData.get('fromUrl') as string | null
  const fromUrlName = (formData.get('name') as string | null) ?? 'imagen.png'

  // Upload from a remote URL (e.g. Supabase Storage) — fetch server-side and forward to ClickUp
  if (fromUrl) {
    try {
      const imgRes = await fetch(fromUrl)
      if (!imgRes.ok) return NextResponse.json({ error: 'No se pudo obtener la imagen' }, { status: 400 })
      const blob = await imgRes.blob()
      if (blob.size > MAX_SIZE_BYTES) {
        return NextResponse.json({ error: 'Archivo demasiado grande (máx. 20 MB)' }, { status: 400 })
      }
      const clickupForm = new FormData()
      clickupForm.append('attachment', blob, fromUrlName)
      const data = await clickupClient.postFormData(`/task/${id}/attachment`, clickupForm)
      return NextResponse.json({ attachment: data }, { status: 201 })
    } catch (err) {
      return NextResponse.json({ error: String(err) }, { status: 500 })
    }
  }

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'Archivo demasiado grande (máx. 20 MB)' }, { status: 400 })
  }

  try {
    const clickupForm = new FormData()
    clickupForm.append('attachment', file, file.name)
    const data = await clickupClient.postFormData(`/task/${id}/attachment`, clickupForm)
    return NextResponse.json({ attachment: data }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

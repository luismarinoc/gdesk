import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clickupClient } from '@/lib/clickup/client'

const FOLDER_ID = process.env.CLICKUP_FOLDER_ID!

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await clickupClient.get(`/folder/${FOLDER_ID}/list`)
    const lists = (data.lists ?? []).map((l: { id: string; name: string }) => ({
      id: l.id,
      name: l.name,
    }))
    return NextResponse.json({ lists })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

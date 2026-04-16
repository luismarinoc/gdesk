import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  await supabase.auth.signOut()
  const referer = req.headers.get('referer') ?? ''
  const locale = referer.match(/\/([a-z]{2})\//)?.[1] ?? 'es'
  return NextResponse.redirect(new URL(`/${locale}/login`, req.url))
}

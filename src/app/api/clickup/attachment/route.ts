import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const url = req.nextUrl.searchParams.get('url')
  if (!url) return new NextResponse('Missing url', { status: 400 })

  // Only allow ClickUp attachment URLs
  if (!url.includes('clickup') && !url.includes('clickup-attachments')) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  const token = process.env.CLICKUP_API_TOKEN
  if (!token) return new NextResponse('No token', { status: 500 })

  const res = await fetch(url, {
    headers: { Authorization: token },
  })

  if (!res.ok) return new NextResponse('Not found', { status: 404 })

  const contentType = res.headers.get('content-type') ?? 'application/octet-stream'
  const buffer = await res.arrayBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}

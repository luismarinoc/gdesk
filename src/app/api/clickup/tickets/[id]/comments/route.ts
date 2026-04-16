// src/app/api/clickup/tickets/[id]/comments/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listComments, createComment } from '@/services/clickup-comment.service'
import { createCommentSchema } from '@/lib/validations/comment.schema'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('full_name, clickup_user_id, clickup_user_name')
    .eq('id', user.id)
    .single()
  const authorName = profile?.clickup_user_name ?? profile?.full_name ?? null
  return { user, authorName, clickupUserId: profile?.clickup_user_id ?? null }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const comments = await listComments(id)
    return NextResponse.json({ comments })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = createCommentSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  try {
    // Prefijar con el nombre del usuario si tiene clickup_user_id asociado o full_name
    const authorName = auth.authorName
    const data = authorName
      ? { ...parsed.data, content: `<strong>${authorName}:</strong> ${parsed.data.content}` }
      : parsed.data
    const comment = await createComment(id, data)
    return NextResponse.json({ comment }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

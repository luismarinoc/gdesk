import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listReplies } from '@/services/clickup-comment.service'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: commentId } = await params
  const ticketId = req.nextUrl.searchParams.get('ticketId') ?? ''
  try {
    const replies = await listReplies(commentId, ticketId)
    return NextResponse.json({ replies })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

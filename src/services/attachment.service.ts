import { createClient } from '@/lib/supabase/server'

export async function saveAttachmentRecord(params: {
  ticketId: string
  commentId?: string
  name: string
  storagePath: string
  publicUrl: string
  mimeType: string
  sizeBytes: number
  uploadedBy: string
}) {
  const supabase = await createClient()
  const { data, error } = await supabase.from('attachments').insert({
    ticket_id: params.ticketId,
    comment_id: params.commentId ?? null,
    name: params.name,
    storage_path: params.storagePath,
    public_url: params.publicUrl,
    mime_type: params.mimeType,
    size_bytes: params.sizeBytes,
    uploaded_by: params.uploadedBy,
  }).select().single()

  if (error) throw new Error(error.message)
  return data
}

export async function getSignedUrl(bucket: string, path: string): Promise<string> {
  const supabase = await createClient()
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  return data?.signedUrl ?? ''
}

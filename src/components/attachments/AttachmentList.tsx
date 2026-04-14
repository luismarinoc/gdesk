import { AttachmentItem } from './AttachmentItem'
import type { GDeskAttachment } from '@/types'

export function AttachmentList({ attachments }: { attachments: GDeskAttachment[] }) {
  if (!attachments.length) return null
  return (
    <div className="space-y-1">
      {attachments.map(a => <AttachmentItem key={a.id} attachment={a} />)}
    </div>
  )
}

import { useTranslations } from 'next-intl'
import { FileIcon, DownloadIcon, FileSpreadsheet, FileText, FileImage } from 'lucide-react'
import type { GDeskAttachment } from '@/types'

function getIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return <FileImage className="w-4 h-4" />
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-4 h-4" />
  if (mimeType.includes('word') || mimeType === 'application/pdf') return <FileText className="w-4 h-4" />
  return <FileIcon className="w-4 h-4" />
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function AttachmentItem({ attachment }: { attachment: GDeskAttachment }) {
  const t = useTranslations('attachments')
  return (
    <div className="flex items-center gap-2 p-2 border rounded-md bg-gray-50 text-sm">
      {getIcon(attachment.mimeType)}
      <span className="flex-1 truncate">{attachment.name}</span>
      <span className="text-gray-400 shrink-0">{formatSize(attachment.sizeBytes)}</span>
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        download={attachment.name}
        className="h-7 w-7 flex items-center justify-center rounded hover:bg-gray-100 shrink-0"
      >
        <DownloadIcon className="w-3 h-3" />
        <span className="sr-only">{t('download')}</span>
      </a>
    </div>
  )
}

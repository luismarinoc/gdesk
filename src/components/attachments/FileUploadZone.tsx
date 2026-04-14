'use client'

import { useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import { UploadIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  ticketId: string
  onUploaded?: (name: string, url: string, path: string, mimeType: string, sizeBytes: number) => void
}

export function FileUploadZone({ ticketId, onUploaded }: FileUploadZoneProps) {
  const t = useTranslations('attachments')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function uploadFile(file: File) {
    setUploading(true)
    setError('')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'ticket-attachments')
    formData.append('ticketId', ticketId)

    try {
      const res = await fetch('/api/storage/upload', { method: 'POST', body: formData })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? 'Upload failed')
        return
      }
      const data = await res.json()
      onUploaded?.(data.name, data.url, data.path, data.mimeType, data.sizeBytes)
    } catch {
      setError('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files).slice(0, 10)
    files.forEach(uploadFile)
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 10)
    files.forEach(uploadFile)
    e.target.value = ''
  }

  return (
    <div className="space-y-1">
      <div
        className={cn(
          'border-2 border-dashed rounded-md p-4 text-center cursor-pointer transition-colors',
          dragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        )}
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <UploadIcon className="w-6 h-6 mx-auto mb-1 text-gray-400" />
        <p className="text-sm text-gray-500">
          {uploading ? t('uploading') : t('dropzone')}
        </p>
        <p className="text-xs text-gray-400">{t('maxSize')}</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.xlsx,.docx,.png,.jpg,.jpeg,.gif,.zip"
          className="hidden"
          onChange={handleChange}
        />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}

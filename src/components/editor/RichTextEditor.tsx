// src/components/editor/RichTextEditor.tsx
'use client'

import { useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import UnderlineExt from '@tiptap/extension-underline'
import LinkExt from '@tiptap/extension-link'
import ImageExt from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import { EditorToolbar } from './EditorToolbar'

interface RichTextEditorProps {
  content?: string
  placeholder?: string
  onChange?: (html: string) => void
  hideToolbar?: boolean
  minHeight?: string
}

export function RichTextEditor({ content = '', placeholder, onChange, hideToolbar = false, minHeight = '120px' }: RichTextEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      UnderlineExt,
      LinkExt.configure({ openOnClick: false }),
      ImageExt,
      Placeholder.configure({ placeholder: placeholder ?? 'Write something...' }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
  })

  async function handleImageUpload() {
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !editor) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'comment-images')

    const res = await fetch('/api/storage/upload', { method: 'POST', body: formData })
    if (!res.ok) return
    const { url } = await res.json()
    editor.chain().focus().setImage({ src: url }).run()
    e.target.value = ''
  }

  if (!editor) return null

  return (
    <div className="border rounded-md overflow-hidden">
      {!hideToolbar && <EditorToolbar editor={editor} onImageUpload={handleImageUpload} />}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-3 focus:outline-none"
        style={{ minHeight }}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}

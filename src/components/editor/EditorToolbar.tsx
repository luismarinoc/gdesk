// src/components/editor/EditorToolbar.tsx
'use client'

import type { Editor } from '@tiptap/react'
import { Button } from '@/components/ui/button'
import { Bold, Italic, Underline, Heading1, Heading2, List, ListOrdered, Link, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EditorToolbarProps {
  editor: Editor
  onImageUpload: () => void
}

export function EditorToolbar({ editor, onImageUpload }: EditorToolbarProps) {
  const btn = (active: boolean) =>
    cn('h-8 w-8 p-0', active ? 'bg-gray-200' : 'hover:bg-gray-100')

  function addLink() {
    const url = window.prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  return (
    <div className="flex items-center gap-1 border-b p-2 flex-wrap">
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('bold'))}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('italic'))}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('underline'))}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <Underline className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('heading', { level: 1 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="w-4 h-4" />
      </Button>
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('heading', { level: 2 }))}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('bulletList'))}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        type="button" variant="ghost" size="icon"
        className={btn(editor.isActive('orderedList'))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <div className="w-px h-6 bg-gray-200 mx-1" />
      <Button type="button" variant="ghost" size="icon" className={btn(false)} onClick={addLink}>
        <Link className="w-4 h-4" />
      </Button>
      <Button type="button" variant="ghost" size="icon" className={btn(false)} onClick={onImageUpload}>
        <Image className="w-4 h-4" />
      </Button>
    </div>
  )
}

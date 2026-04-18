// src/components/editor/RichTextRenderer.tsx
'use client'

import { useMemo } from 'react'
import DOMPurify from 'isomorphic-dompurify'

interface RichTextRendererProps {
  html: string
  className?: string
}

export function RichTextRenderer({ html, className }: RichTextRendererProps) {
  const sanitized = useMemo(() => DOMPurify.sanitize(html, {
    ADD_ATTR: ['style', 'title'],
    ADD_TAGS: ['figure', 'figcaption'],
    FORCE_BODY: false,
  }), [html])
  return (
    <div
      className={`prose prose-sm max-w-none ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  )
}

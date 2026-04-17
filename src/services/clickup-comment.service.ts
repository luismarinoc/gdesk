// src/services/clickup-comment.service.ts
import { clickupClient } from '@/lib/clickup/client'
import { mapClickupCommentToGDesk } from '@/lib/clickup/transformers'
import type { GDeskComment } from '@/types'
import type { CreateCommentInput } from '@/lib/validations/comment.schema'

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type ClickupDocNode =
  | { text: string; attributes?: Record<string, boolean> }
  | { type: 'image'; image: { url: string; name: string } }

function htmlToClickupNodes(html: string): ClickupDocNode[] {
  const nodes: ClickupDocNode[] = []
  const attrStack: Record<string, boolean>[] = [{}]

  function currentAttrs() { return { ...attrStack[attrStack.length - 1] } }

  const tokens = html.split(/(<[^>]+>)/g)

  for (const token of tokens) {
    if (!token) continue

    if (!token.startsWith('<')) {
      const text = token
        .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
        .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
      if (text) {
        const attrs = currentAttrs()
        nodes.push(Object.keys(attrs).length > 0 ? { text, attributes: attrs } : { text })
      }
      continue
    }

    // Closing tag
    const closeMatch = token.match(/^<\/([a-zA-Z]+)>$/)
    if (closeMatch) {
      const tag = closeMatch[1].toLowerCase()
      if (['strong', 'b', 'em', 'i', 'u'].includes(tag)) attrStack.pop()
      else if (['p', 'div', 'h1', 'h2', 'h3', 'li'].includes(tag)) nodes.push({ text: '\n' })
      continue
    }

    // <img>
    if (/^<img/i.test(token)) {
      const src = (token.match(/src="([^"]*)"/i) ?? [])[1] ?? ''
      const alt = (token.match(/alt="([^"]*)"/i) ?? [])[1] ?? 'image'
      if (src) nodes.push({ type: 'image', image: { url: src, name: alt || 'image' } })
      continue
    }

    // <br>
    if (/^<br[\s/]/i.test(token) || token === '<br>') {
      nodes.push({ text: '\n' })
      continue
    }

    // Opening inline tags
    const openMatch = token.match(/^<([a-zA-Z]+)/)
    if (openMatch) {
      const tag = openMatch[1].toLowerCase()
      if (['strong', 'b', 'em', 'i', 'u'].includes(tag)) {
        const newAttrs = { ...currentAttrs() }
        if (tag === 'strong' || tag === 'b') newAttrs.bold = true
        if (tag === 'em' || tag === 'i') newAttrs.italic = true
        if (tag === 'u') newAttrs.underline = true
        attrStack.push(newAttrs)
      }
    }
  }

  // Drop trailing newline-only nodes
  while (nodes.length > 0) {
    const last = nodes[nodes.length - 1]
    if ('text' in last && last.text === '\n') nodes.pop()
    else break
  }

  return nodes.filter(n => 'type' in n || (n as { text: string }).text !== '')
}

export async function listComments(ticketId: string): Promise<GDeskComment[]> {
  const data = await clickupClient.get(`/task/${ticketId}/comment`)
  const comments = data.comments ?? []
  // Sort oldest-first (chronological order)
  const sorted = [...comments].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.date) - Number(b.date))
  return sorted.map((c: unknown) => mapClickupCommentToGDesk(c, ticketId))
}

export async function listReplies(commentId: string, ticketId: string): Promise<GDeskComment[]> {
  const data = await clickupClient.get(`/comment/${commentId}/reply`)
  const replies = data.comments ?? []
  const sorted = [...replies].sort((a: Record<string, unknown>, b: Record<string, unknown>) => Number(a.date) - Number(b.date))
  return sorted.map((c: unknown) => mapClickupCommentToGDesk(c, ticketId))
}

export async function deleteComment(commentId: string): Promise<void> {
  await clickupClient.delete(`/comment/${commentId}`)
}

export async function createComment(
  ticketId: string,
  input: CreateCommentInput
): Promise<GDeskComment> {
  const hasImages = input.content.includes('<img')
  const endpoint = input.parentCommentId
    ? `/comment/${input.parentCommentId}/reply`
    : `/task/${ticketId}/comment`

  const body: Record<string, unknown> = { notify_all: false }

  if (hasImages) {
    body.comment = htmlToClickupNodes(input.content)
    body.comment_text = htmlToPlainText(input.content)
  } else {
    body.comment_text = htmlToPlainText(input.content)
  }

  const data = await clickupClient.post(endpoint, body)
  return mapClickupCommentToGDesk(data, ticketId)
}

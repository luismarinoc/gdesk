/**
 * Converts ClickUp's text/rich formats to displayable HTML.
 */

// ── Plain text description (with !image|props! syntax) ──────────────────────
export function clickupTextToHtml(text: string): string {
  if (!text) return ''
  if (text.trimStart().startsWith('<')) return text

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    // ClickUp image ref: !filename|width=N,height=N,alt="..."!
    .replace(/!([^!|]+?)(?:\|[^!]*)?\!/g, (_match, filename) => {
      return `<span style="display:inline-flex;align-items:center;gap:4px;background:#f3f4f6;border:1px solid #e5e7eb;border-radius:4px;padding:2px 6px;font-size:11px;color:#6b7280;">`
           + `📎 ${filename}</span>`
    })
    .replace(/\r\n/g, '\n')
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br>')

  return `<p>${html}</p>`
}

// ── Rich comment array (ClickUp doc format) ─────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function clickupRichCommentToHtml(parts: any[]): string {
  if (!Array.isArray(parts) || parts.length === 0) return ''

  let html = ''

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    const text: string = typeof part.text === 'string' ? part.text : ''
    const attrs = part.attributes ?? {}

    // ClickUp image node: { type: "image", image: { url, name, ... } }
    if (part.type === 'image' && part.image?.url) {
      const proxyUrl = `/api/clickup/attachment?url=${encodeURIComponent(part.image.url)}`
      // Check if the next node is a confirmed label ("Imagen X.Y")
      const nextPart = parts[i + 1]
      const nextText: string = typeof nextPart?.text === 'string' ? nextPart.text : ''
      if (/^Imagen \d+\.\d+$/.test(nextText)) {
        i++ // consume the label node
        html += `<figure style="display:inline-block;margin:4px 0 2px;">`
             + `<img src="${proxyUrl}" alt="${nextText}" title="${nextText}" style="max-width:320px;width:100%;border-radius:6px;display:block;border:1px solid #e5e7eb;" />`
             + `<figcaption style="font-size:11px;color:#9ca3af;text-align:center;margin-top:3px;">${nextText}</figcaption>`
             + `</figure>`
      } else {
        html += `<img src="${proxyUrl}" alt="${part.image.name ?? 'imagen'}" style="max-width:320px;width:100%;border-radius:6px;margin:6px 0;display:block;border:1px solid #e5e7eb;" />`
      }
      continue
    }

    // ClickUp mention/tag node: { type: "tag", user: { username } }
    if (part.type === 'tag' && part.user) {
      html += `<span style="color:#1B3A6B;font-weight:500;background:#eff6ff;padding:1px 4px;border-radius:3px;">@${part.user.username}</span>`
      continue
    }

    // Skip block-id newlines (pure whitespace with only block-id attr)
    if (!text.trim() && attrs['block-id'] && Object.keys(attrs).length === 1) {
      html += '<br>'
      continue
    }

    if (!text) continue

    let segment = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')

    // Basic formatting
    if (attrs.bold)      segment = `<strong>${segment}</strong>`
    if (attrs.italic)    segment = `<em>${segment}</em>`
    if (attrs.underline) segment = `<u>${segment}</u>`
    if (attrs.code)      segment = `<code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:12px;">${segment}</code>`

    html += segment
  }

  return html ? `<p style="margin:0 0 4px;">${html}</p>` : ''
}

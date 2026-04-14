const CLICKUP_BASE_URL = 'https://api.clickup.com/api/v2'

async function clickupFetch(path: string, options: RequestInit = {}) {
  const token = process.env.CLICKUP_API_TOKEN
  if (!token) throw new Error('CLICKUP_API_TOKEN not configured')

  const res = await fetch(`${CLICKUP_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`ClickUp API error ${res.status}: ${text}`)
  }

  return res.json()
}

export const clickupClient = {
  get: (path: string) => clickupFetch(path),
  post: (path: string, body: unknown) =>
    clickupFetch(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path: string, body: unknown) =>
    clickupFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path: string) => clickupFetch(path, { method: 'DELETE' }),
}

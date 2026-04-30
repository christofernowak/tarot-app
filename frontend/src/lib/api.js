// src/lib/api.js
// Cliente centralizado — todas as chamadas passam por aqui
// Segurança: token JWT injetado automaticamente; nunca hardcoded

const BASE = import.meta.env.VITE_API_URL || 'https://tarot-app-production-44e9.up.railway.app/api'

function getToken() {
  return localStorage.getItem('tarot_token')
}

async function request(path, options = {}) {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })

  // Token expirado → limpa sessão e redireciona
  if (res.status === 401) {
    localStorage.removeItem('tarot_token')
    window.location.href = '/login'
    return
  }

  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw Object.assign(new Error(data.error || 'Erro desconhecido'), { status: res.status, data })
  return data
}

export const api = {
  get:    (path, opts)  => request(path, { method: 'GET', ...opts }),
  post:   (path, body)  => request(path, { method: 'POST', body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),

  // Streaming SSE para leituras de tarô
  async stream(path, body, onDelta, onDone) {
  const token = getToken()
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || 'Erro ao iniciar leitura.')
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  let accumulated = ''

  try {
    while (true) {
      const { done, value } = await reader.read()

      if (done) {
        // Stream fechou — tenta extrair JSON do que acumulou
        try {
          const match = accumulated.match(/\{[\s\S]*\}/)
          if (match) {
            const parsed = JSON.parse(match[0])
            onDone({ done: true, parsed })
          } else {
            onDone({ done: true, parsed: {} })
          }
        } catch {
          onDone({ done: true, parsed: {} })
        }
        break
      }

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n\n')
      buffer = lines.pop() // guarda fragmento incompleto

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (!payload || payload === '[DONE]') continue

        try {
          const json = JSON.parse(payload)
          if (json.delta) {
            accumulated += json.delta
            onDelta(json.delta)
          }
          if (json.done) {
            onDone(json)
            return
          }
          if (json.error) {
            throw new Error(json.error)
          }
        } catch (parseErr) {
          // ignora linhas malformadas do SSE
        }
      }
    }
  } catch (err) {
    // Se acumulou texto suficiente, tenta mostrar mesmo assim
    if (accumulated.length > 100) {
      try {
        const match = accumulated.match(/\{[\s\S]*\}/)
        if (match) {
          onDone({ done: true, parsed: JSON.parse(match[0]) })
          return
        }
      } catch {}
    }
    throw err
  }
},
}

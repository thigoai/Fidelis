import type { ApiErrorBody } from '@/types/api'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/$/, '')

export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, body: ApiErrorBody) {
    super(body.message || `HTTP ${status}`)
    this.status = status
    this.code = body.error
  }
}

type UnauthorizedHandler = () => void

/**
 * ApiClient é singleton e segura:
 *  - o JWT atual em memória (setado pelo AuthProvider após login/hydrate)
 *  - uma lista de handlers chamados quando o servidor responde 401
 *
 * O 401-handler é o gancho que o AuthProvider usa para deslogar (sem o
 * client conhecer o React).
 */
class ApiClient {
  private token: string | null = null
  private unauthorizedHandlers = new Set<UnauthorizedHandler>()

  setToken(token: string | null): void {
    this.token = token
  }

  /** Registra um handler para 401. Retorna função de unsubscribe. */
  onUnauthorized(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandlers.add(handler)
    return () => {
      this.unauthorizedHandlers.delete(handler)
    }
  }

  async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = {}
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (this.token) headers.Authorization = `Bearer ${this.token}`

    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    // 204 No Content
    if (res.status === 204) return undefined as T

    const text = await res.text()
    const parsed: unknown = text ? safeJsonParse(text) : null

    if (!res.ok) {
      if (res.status === 401) {
        for (const h of this.unauthorizedHandlers) h()
      }
      throw new ApiError(
        res.status,
        (parsed as ApiErrorBody | null) ?? { error: 'unknown', message: res.statusText },
      )
    }
    return parsed as T
  }

  get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path)
  }
  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, body)
  }
  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, body)
  }
  patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, body)
  }
  delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path)
  }
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

export const apiClient = new ApiClient()

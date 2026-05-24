import type { User } from '@/types/api'

const KEY = 'fidelis.cliente.auth'

export type StoredAuth = {
  user: User
  token: string
  expiresAt: string
}

export const authStorage = {
  load(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredAuth
      if (!parsed?.token || !parsed?.user || !parsed?.expiresAt) return null
      return parsed
    } catch {
      return null
    }
  },
  save(data: StoredAuth): void {
    localStorage.setItem(KEY, JSON.stringify(data))
  },
  clear(): void {
    localStorage.removeItem(KEY)
  },
}

import type { User } from '@/types/api'

const KEY = 'fidelis.loja.auth'

export type StoredAuth = {
  user: User
  token: string
  expiresAt: string // ISO 8601 do backend
}

export const authStorage = {
  load(): StoredAuth | null {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return null
      const parsed = JSON.parse(raw) as StoredAuth
      // sanity check minimo — se schema mudar entre versoes
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

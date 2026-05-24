import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

import { apiClient } from '@/api/client'
import type { AuthResponse, RegisterLojistaRequest, User } from '@/types/api'
import { authStorage, type StoredAuth } from './storage'

type Status = 'loading' | 'authenticated' | 'unauthenticated'

type State = {
  user: User | null
  token: string | null
  expiresAt: string | null
  status: Status
}

type Action =
  | { type: 'hydrate'; payload: StoredAuth | null }
  | { type: 'login'; payload: StoredAuth }
  | { type: 'setUser'; payload: User }
  | { type: 'logout' }

const initialState: State = {
  user: null,
  token: null,
  expiresAt: null,
  status: 'loading',
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'hydrate':
      if (!action.payload) return { ...state, status: 'unauthenticated' }
      return {
        user: action.payload.user,
        token: action.payload.token,
        expiresAt: action.payload.expiresAt,
        status: 'authenticated',
      }
    case 'login':
      return {
        user: action.payload.user,
        token: action.payload.token,
        expiresAt: action.payload.expiresAt,
        status: 'authenticated',
      }
    case 'setUser':
      if (!state.user) return state
      return { ...state, user: action.payload }
    case 'logout':
      return { user: null, token: null, expiresAt: null, status: 'unauthenticated' }
    default:
      return state
  }
}

type AuthContextValue = State & {
  login: (email: string, password: string) => Promise<void>
  registerLojista: (input: RegisterLojistaRequest) => Promise<void>
  setUser: (user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const saved = authStorage.load()
    if (saved && new Date(saved.expiresAt) > new Date()) {
      apiClient.setToken(saved.token)
      dispatch({ type: 'hydrate', payload: saved })
    } else {
      if (saved) authStorage.clear()
      apiClient.setToken(null)
      dispatch({ type: 'hydrate', payload: null })
    }
  }, [])

  useEffect(() => {
    return apiClient.onUnauthorized(() => {
      authStorage.clear()
      apiClient.setToken(null)
      dispatch({ type: 'logout' })
    })
  }, [])

  const authenticate = useCallback((res: AuthResponse) => {
    const stored: StoredAuth = {
      user: res.user,
      token: res.token,
      expiresAt: res.expires_at,
    }
    apiClient.setToken(stored.token)
    authStorage.save(stored)
    dispatch({ type: 'login', payload: stored })
  }, [])

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await apiClient.post<AuthResponse>('/auth/login', { email, password })
      authenticate(res)
    },
    [authenticate],
  )

  const registerLojista = useCallback(
    async (input: RegisterLojistaRequest) => {
      const res = await apiClient.post<AuthResponse>('/auth/register/lojista', input)
      authenticate(res)
    },
    [authenticate],
  )

  // Atualiza User no estado E no localStorage. Use depois de PATCH /api/me.
  const setUser = useCallback((user: User) => {
    const saved = authStorage.load()
    if (saved) {
      authStorage.save({ ...saved, user })
    }
    dispatch({ type: 'setUser', payload: user })
  }, [])

  const logout = useCallback(() => {
    authStorage.clear()
    apiClient.setToken(null)
    dispatch({ type: 'logout' })
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, registerLojista, setUser, logout }),
    [state, login, registerLojista, setUser, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}

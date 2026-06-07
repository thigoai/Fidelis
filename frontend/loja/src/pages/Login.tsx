import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router'

import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

type LocationState =
  | { from?: { pathname?: string }; passwordReset?: boolean }
  | null

export default function LoginPage() {
  const { user, status, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    const from = (location.state as LocationState)?.from?.pathname ?? '/dashboard'
    return <Navigate to={from} replace />
  }

  // Flash exibido apos reset de senha bem sucedido (location state vem do ResetSenha).
  const passwordReset = (location.state as LocationState)?.passwordReset === true

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-50 px-4 dark:bg-surface-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)] dark:bg-surface-900"
      >
        <header className="space-y-1">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Fidelis · Loja
          </p>
          <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
            Entrar no painel
          </h1>
        </header>

        {passwordReset && (
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            Senha atualizada. Entre com a nova.
          </div>
        )}

        <div className="space-y-3">
          <Field
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={setEmail}
          />
          <Field
            label="Senha"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={setPassword}
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="flex flex-col gap-1 text-center text-sm text-surface-500 dark:text-surface-400">
          <Link
            to="/esqueci-senha"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Esqueci minha senha
          </Link>
          <span>
            Ainda não tem uma loja?{' '}
            <Link to="/register" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
              Cadastre-se
            </Link>
          </span>
        </div>
      </form>
    </div>
  )
}

type FieldProps = {
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}

function Field({ label, type, value, onChange, autoComplete }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
        {label}
      </span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-surface-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
      />
    </label>
  )
}

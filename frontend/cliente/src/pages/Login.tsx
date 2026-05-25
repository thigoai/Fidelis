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
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-slate-900/80 p-8 ring-1 ring-white/5 backdrop-blur"
      >
        <header className="space-y-1">
          <p className="text-sm font-medium text-violet-400">Fidelis</p>
          <h1 className="text-2xl font-semibold">Entrar</h1>
        </header>

        {passwordReset && (
          <div className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
            Senha atualizada. Entre com a nova.
          </div>
        )}

        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" autoComplete="current-password" value={password} onChange={setPassword} />

        {error && (
          <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-60"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>

        <div className="flex flex-col gap-1 text-center text-sm text-slate-400">
          <Link to="/esqueci-senha" className="font-medium text-violet-400 hover:underline">
            Esqueci minha senha
          </Link>
          <span>
            Novo por aqui?{' '}
            <Link to="/register" className="font-medium text-violet-400 hover:underline">
              Criar conta
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
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
    </label>
  )
}

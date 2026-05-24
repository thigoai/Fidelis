import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

export default function RegisterPage() {
  const { user, status, registerCliente } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await registerCliente({ name, email, password })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 py-10 text-slate-100">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-5 rounded-2xl bg-slate-900/80 p-8 ring-1 ring-white/5 backdrop-blur"
      >
        <header className="space-y-1">
          <p className="text-sm font-medium text-violet-400">Fidelis</p>
          <h1 className="text-2xl font-semibold">Criar conta</h1>
          <p className="text-sm text-slate-400">
            Acompanhe seus pontos em todas as lojas que participam.
          </p>
        </header>

        <Field label="Nome" type="text" autoComplete="name" value={name} onChange={setName} />
        <Field label="Email" type="email" autoComplete="email" value={email} onChange={setEmail} />
        <Field label="Senha" type="password" autoComplete="new-password" minLength={6}
          value={password} onChange={setPassword} hint="Mínimo 6 caracteres." />

        {error && (
          <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40 disabled:opacity-60"
        >
          {submitting ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-slate-400">
          Já tem conta?{' '}
          <Link to="/login" className="font-medium text-violet-400 hover:underline">
            Entrar
          </Link>
        </p>
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
  minLength?: number
  hint?: string
}

function Field({ label, type, value, onChange, autoComplete, minLength, hint }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

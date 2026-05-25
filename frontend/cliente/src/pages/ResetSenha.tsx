import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { ApiError, apiClient } from '@/api/client'

export default function ResetSenhaPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') ?? ''

  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (next !== confirm) {
      setError('A confirmação não bate com a nova senha.')
      return
    }
    if (next.length < 6) {
      setError('A nova senha precisa ter pelo menos 6 caracteres.')
      return
    }
    setSubmitting(true)
    try {
      await apiClient.post('/auth/password-reset/confirm', {
        token,
        new_password: next,
      })
      navigate('/login', { replace: true, state: { passwordReset: true } })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm space-y-5 rounded-2xl bg-slate-900/80 p-8 ring-1 ring-white/5 backdrop-blur">
        <header className="space-y-1">
          <p className="text-sm font-medium text-violet-400">Fidelis</p>
          <h1 className="text-2xl font-semibold">Definir nova senha</h1>
        </header>

        {!token ? (
          <div className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-200">
            Link inválido. Solicite um novo email de recuperação.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-200">Nova senha</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <span className="text-xs text-slate-500">Mínimo 6 caracteres.</span>
            </label>

            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-200">Confirmar nova senha</span>
              <input
                type="password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-violet-600 px-4 py-2 font-medium text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {submitting ? 'Salvando…' : 'Definir nova senha'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-slate-400">
          <Link to="/login" className="font-medium text-violet-400 hover:underline">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

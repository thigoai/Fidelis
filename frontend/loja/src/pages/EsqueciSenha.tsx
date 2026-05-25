import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'

import { ApiError, apiClient } from '@/api/client'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await apiClient.post('/auth/password-reset/request', { email: email.trim() })
      // Sempre devolve 204 — nao revela se o email existe.
      setDone(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-50 px-4 dark:bg-surface-950">
      <div className="w-full max-w-sm space-y-5 rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)] dark:bg-surface-900">
        <header className="space-y-1">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Fidelis · Loja
          </p>
          <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
            Recuperar senha
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Informe o email cadastrado. Enviaremos um link para definir uma nova senha.
          </p>
        </header>

        {done ? (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
            <p className="font-medium">Pronto.</p>
            <p className="mt-1">
              Se houver uma conta com esse email, você receberá em instantes um link válido
              por 1 hora. Confira também a caixa de spam.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
                Email
              </span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-surface-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {submitting ? 'Enviando…' : 'Enviar link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-surface-500 dark:text-surface-400">
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}

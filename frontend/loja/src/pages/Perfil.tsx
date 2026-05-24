import { useState, type FormEvent } from 'react'

import { ApiError, apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import type { ChangePasswordPayload, UpdateProfilePayload, User } from '@/types/api'

export default function PerfilPage() {
  const { user, setUser } = useAuth()

  if (!user) return null

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Perfil</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Atualize seus dados ou troque a senha de acesso.
        </p>
      </header>

      <ProfileSection user={user} onUpdated={setUser} />
      <PasswordSection />
    </div>
  )
}

// ============================================================
// Dados básicos
// ============================================================

function ProfileSection({
  user,
  onUpdated,
}: {
  user: User
  onUpdated: (u: User) => void
}) {
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const dirty = name !== user.name || (phone || '') !== (user.phone ?? '')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
    setSubmitting(true)
    try {
      const payload: UpdateProfilePayload = {
        name: name.trim(),
        phone: phone.trim() || null,
      }
      const updated = await apiClient.request<User>('PATCH', '/api/me', payload)
      onUpdated(updated)
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900"
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          Dados básicos
        </h3>
        <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
          Email não pode ser alterado nesta versão.
        </p>
      </div>

      <Field label="Nome" type="text" required value={name} onChange={setName} />
      <Field label="Telefone" type="text" value={phone} onChange={setPhone} placeholder="opcional" />
      <Field label="Email" type="email" value={user.email} onChange={() => {}} disabled />

      {error && <ErrorBanner message={error} />}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Perfil atualizado.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !dirty}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// Trocar senha
// ============================================================

function PasswordSection() {
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(false)
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
      const payload: ChangePasswordPayload = {
        current_password: current,
        new_password: next,
      }
      await apiClient.post('/api/me/password', payload)
      setCurrent('')
      setNext('')
      setConfirm('')
      setSuccess(true)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900"
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
          Trocar senha
        </h3>
        <p className="mt-1 text-xs text-surface-400 dark:text-surface-500">
          Você precisa informar a senha atual para confirmar.
        </p>
      </div>

      <Field label="Senha atual" type="password" required autoComplete="current-password"
        value={current} onChange={setCurrent} />
      <Field label="Nova senha" type="password" required minLength={6} autoComplete="new-password"
        value={next} onChange={setNext} hint="Mínimo 6 caracteres." />
      <Field label="Confirmar nova senha" type="password" required minLength={6} autoComplete="new-password"
        value={confirm} onChange={setConfirm} />

      {error && <ErrorBanner message={error} />}
      {success && (
        <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
          Senha atualizada.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? 'Atualizando…' : 'Trocar senha'}
        </button>
      </div>
    </form>
  )
}

// ============================================================
// UI helpers
// ============================================================

type FieldProps = {
  label: string
  type: 'text' | 'email' | 'password'
  value: string
  onChange: (v: string) => void
  required?: boolean
  minLength?: number
  autoComplete?: string
  placeholder?: string
  disabled?: boolean
  hint?: string
}

function Field({
  label, type, value, onChange, required, minLength, autoComplete, placeholder, disabled, hint,
}: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-surface-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 disabled:cursor-not-allowed disabled:bg-surface-100 disabled:text-surface-500 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50 dark:disabled:bg-surface-800/50"
      />
      {hint && <span className="text-xs text-surface-500 dark:text-surface-400">{hint}</span>}
    </label>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
      {message}
    </div>
  )
}

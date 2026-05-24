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
        <h2 className="text-xl font-semibold text-slate-50">Perfil</h2>
        <p className="text-sm text-slate-400">
          Atualize seus dados ou troque a senha de acesso.
        </p>
      </header>

      <ProfileSection user={user} onUpdated={setUser} />
      <PasswordSection />
    </div>
  )
}

function ProfileSection({ user, onUpdated }: { user: User; onUpdated: (u: User) => void }) {
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
      className="space-y-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/5"
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Dados básicos
        </h3>
        <p className="mt-1 text-xs text-slate-500">Email não pode ser alterado nesta versão.</p>
      </div>

      <Field label="Nome" type="text" required value={name} onChange={setName} />
      <Field label="Telefone" type="text" value={phone} onChange={setPhone} placeholder="opcional" />
      <Field label="Email" type="email" value={user.email} onChange={() => {}} disabled />

      {error && <ErrorBanner message={error} />}
      {success && (
        <p className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          Perfil atualizado.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting || !dirty}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {submitting ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>
    </form>
  )
}

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
      className="space-y-4 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/5"
    >
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
          Trocar senha
        </h3>
        <p className="mt-1 text-xs text-slate-500">
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
        <p className="rounded-lg bg-emerald-950/40 px-3 py-2 text-sm text-emerald-300">
          Senha atualizada.
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:opacity-50"
        >
          {submitting ? 'Atualizando…' : 'Trocar senha'}
        </button>
      </div>
    </form>
  )
}

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
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        type={type}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        placeholder={placeholder}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-50 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:bg-slate-800/50 disabled:text-slate-500"
      />
      {hint && <span className="text-xs text-slate-500">{hint}</span>}
    </label>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-950/40 px-3 py-2 text-sm text-red-200">{message}</div>
  )
}

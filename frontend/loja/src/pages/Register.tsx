import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'

import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'

export default function RegisterPage() {
  const { user, status, registerLojista } = useAuth()
  const navigate = useNavigate()

  // Dono
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPassword, setOwnerPassword] = useState('')

  // Loja
  const [storeName, setStoreName] = useState('')
  const [storeSlug, setStoreSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [primaryColor, setPrimaryColor] = useState('#7c3aed')

  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (status === 'authenticated' && user) {
    return <Navigate to="/dashboard" replace />
  }

  function handleStoreNameChange(value: string) {
    setStoreName(value)
    // Auto-sugere slug ate o usuario editar manualmente
    if (!slugTouched) {
      setStoreSlug(slugify(value))
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await registerLojista({
        owner: {
          name: ownerName,
          email: ownerEmail,
          password: ownerPassword,
        },
        store: {
          name: storeName,
          slug: storeSlug,
          primary_color: primaryColor,
        },
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('Erro inesperado. Tente novamente.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-surface-50 px-4 py-10 dark:bg-surface-950">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg space-y-6 rounded-[var(--radius-card)] bg-white p-8 shadow-[var(--shadow-card)] dark:bg-surface-900"
      >
        <header className="space-y-1">
          <p className="text-sm font-medium text-brand-600 dark:text-brand-400">
            Fidelis · Loja
          </p>
          <h1 className="text-2xl font-semibold text-surface-900 dark:text-surface-50">
            Crie sua loja
          </h1>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Você cria o cadastro do responsável e a loja em um único passo.
          </p>
        </header>

        <Section title="Seus dados">
          <Field label="Nome do responsável" type="text" autoComplete="name"
            value={ownerName} onChange={setOwnerName} />
          <Field label="Email" type="email" autoComplete="email"
            value={ownerEmail} onChange={setOwnerEmail} />
          <Field label="Senha" type="password" autoComplete="new-password" minLength={6}
            value={ownerPassword} onChange={setOwnerPassword}
            hint="Mínimo 6 caracteres." />
        </Section>

        <Section title="Sua loja">
          <Field label="Nome da loja" type="text"
            value={storeName} onChange={handleStoreNameChange} />
          <Field label="Endereço (slug)" type="text"
            value={storeSlug}
            onChange={(v) => { setSlugTouched(true); setStoreSlug(v) }}
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            hint="Apenas letras minúsculas, números e hífens. Ex.: padaria-da-maria" />

          <label className="block space-y-1">
            <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
              Cor principal
            </span>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-surface-300 bg-white dark:border-surface-700"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className="w-32 rounded-lg border border-surface-300 bg-white px-3 py-2 font-mono text-sm text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
              />
            </div>
          </label>
        </Section>

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
          {submitting ? 'Criando…' : 'Criar conta'}
        </button>

        <p className="text-center text-sm text-surface-500 dark:text-surface-400">
          Já tem uma conta?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:underline dark:text-brand-400">
            Entrar
          </Link>
        </p>
      </form>
    </div>
  )
}

// ---------- helpers de UI ----------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-3">
      <legend className="text-xs font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
        {title}
      </legend>
      {children}
    </fieldset>
  )
}

type FieldProps = {
  label: string
  type: 'email' | 'password' | 'text'
  value: string
  onChange: (v: string) => void
  autoComplete?: string
  minLength?: number
  pattern?: string
  hint?: string
}

function Field({ label, type, value, onChange, autoComplete, minLength, pattern, hint }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
        {label}
      </span>
      <input
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        pattern={pattern}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-surface-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
      />
      {hint && (
        <span className="text-xs text-surface-500 dark:text-surface-400">{hint}</span>
      )}
    </label>
  )
}

// ---------- slug helper ----------

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove acentos
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50)
}

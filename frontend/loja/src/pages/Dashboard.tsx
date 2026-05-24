import { useEffect, useState, type FormEvent } from 'react'

import { ApiError, apiClient } from '@/api/client'
import type {
  AwardPointsRequest,
  AwardPointsResponse,
  MyStoresResponse,
  Store,
} from '@/types/api'

export default function DashboardPage() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<MyStoresResponse>('/api/me/stores')
      .then((res) => {
        setStores(res.stores)
        if (res.stores.length > 0) setSelectedStoreId(res.stores[0].id)
      })
      .catch((err) => {
        setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar lojas')
      })
  }, [])

  const selectedStore = stores?.find((s) => s.id === selectedStoreId) ?? null

  return (
    <div className="space-y-6">
      {stores && stores.length > 1 && (
        <StoreSelector
          stores={stores}
          selectedId={selectedStoreId}
          onSelect={setSelectedStoreId}
        />
      )}

      {loadError && <ErrorBanner message={loadError} />}

      {selectedStore && <StoreInfoCard store={selectedStore} />}

      {stores && stores.length === 0 && (
        <div className="rounded-[var(--radius-card)] bg-white p-6 text-center text-surface-600 shadow-[var(--shadow-card)] dark:bg-surface-900 dark:text-surface-300">
          Você ainda não tem nenhuma loja vinculada à sua conta.
        </div>
      )}

      {selectedStore && <AwardPointsForm storeId={selectedStore.id} />}
    </div>
  )
}

// ============================================================
// Selector / Info card / Form (sem alteracoes funcionais; sem header proprio)
// ============================================================

function StoreSelector({
  stores,
  selectedId,
  onSelect,
}: {
  stores: Store[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {stores.map((s) => {
        const active = s.id === selectedId
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => onSelect(s.id)}
            className={
              'rounded-full border px-4 py-1.5 text-sm font-medium transition ' +
              (active
                ? 'border-brand-600 bg-brand-600 text-white'
                : 'border-surface-300 bg-white text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800')
            }
          >
            {s.name}
          </button>
        )
      })}
    </div>
  )
}

function StoreInfoCard({ store }: { store: Store }) {
  return (
    <section className="flex items-center gap-4 rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <div
        className="h-12 w-12 shrink-0 rounded-full"
        style={{ backgroundColor: store.primary_color ?? '#7c3aed' }}
      />
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold text-surface-900 dark:text-surface-50">
          {store.name}
        </h2>
        <p className="truncate text-sm text-surface-500 dark:text-surface-400">
          {store.slug}
          {store.city && ` · ${store.city}${store.state ? '/' + store.state : ''}`}
        </p>
      </div>
    </section>
  )
}

function AwardPointsForm({ storeId }: { storeId: string }) {
  const [customerEmail, setCustomerEmail] = useState('')
  const [points, setPoints] = useState<number | ''>('')
  const [purchaseAmount, setPurchaseAmount] = useState<number | ''>('')
  const [notes, setNotes] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<AwardPointsResponse | null>(null)

  function reset() {
    setCustomerEmail('')
    setPoints('')
    setPurchaseAmount('')
    setNotes('')
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (typeof points !== 'number' || points <= 0) {
      setError('Informe uma quantidade de pontos positiva.')
      return
    }
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    const payload: AwardPointsRequest = {
      customer_email: customerEmail.trim(),
      points,
      ...(typeof purchaseAmount === 'number' ? { purchase_amount: purchaseAmount } : {}),
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    }

    try {
      const res = await apiClient.post<AwardPointsResponse>(
        `/api/stores/${storeId}/points`,
        payload,
      )
      setSuccess(res)
      reset()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <h2 className="text-base font-semibold text-surface-900 dark:text-surface-50">
        Pontuar cliente
      </h2>
      <p className="mt-1 text-sm text-surface-500 dark:text-surface-400">
        Informe o email do cliente e a quantidade de pontos a creditar.
      </p>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <Field
          label="Email do cliente"
          type="email"
          required
          value={customerEmail}
          onChange={setCustomerEmail}
          placeholder="cliente@email.com"
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Pontos"
            type="number"
            required
            min={1}
            value={points === '' ? '' : String(points)}
            onChange={(v) => setPoints(v === '' ? '' : Number(v))}
            placeholder="100"
          />
          <Field
            label="Valor da compra (R$)"
            type="number"
            min={0}
            step="0.01"
            value={purchaseAmount === '' ? '' : String(purchaseAmount)}
            onChange={(v) => setPurchaseAmount(v === '' ? '' : Number(v))}
            placeholder="opcional"
          />
        </div>

        <Field
          label="Observações"
          type="text"
          value={notes}
          onChange={setNotes}
          placeholder="opcional"
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </p>
        )}

        {success && (
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm dark:bg-emerald-950/40">
            <p className="font-medium text-emerald-800 dark:text-emerald-200">
              {success.transaction.points} pontos creditados.
            </p>
            <p className="mt-1 text-emerald-700 dark:text-emerald-300">
              Saldo atual do cliente:{' '}
              <span className="font-semibold">
                {success.membership.points_balance.toLocaleString('pt-BR')} pts
              </span>
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-brand-600 px-4 py-2 font-medium text-white transition hover:bg-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:opacity-60 sm:w-auto"
        >
          {submitting ? 'Creditando…' : 'Creditar pontos'}
        </button>
      </form>
    </section>
  )
}

type FieldProps = {
  label: string
  type: 'email' | 'password' | 'text' | 'number'
  value: string
  onChange: (v: string) => void
  placeholder?: string
  required?: boolean
  min?: number
  step?: string
}

function Field({ label, type, value, onChange, placeholder, required, min, step }: FieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">
        {label}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
        step={step}
        className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-surface-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-800 dark:text-surface-50"
      />
    </label>
  )
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
      {message}
    </div>
  )
}

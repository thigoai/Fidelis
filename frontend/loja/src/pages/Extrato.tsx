import { useCallback, useEffect, useState } from 'react'

import { ApiError, apiClient } from '@/api/client'
import type {
  MyStoresResponse,
  Store,
  StoreTransactionRow,
  StoreTransactionsResponse,
  TransactionType,
} from '@/types/api'

const PAGE_SIZE = 50

const TYPE_LABELS: Record<TransactionType, string> = {
  purchase: 'Compra',
  redemption: 'Resgate',
  bonus: 'Bônus',
  adjustment: 'Ajuste',
  expiration: 'Expiração',
}

export default function ExtratoPage() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<'' | TransactionType>('')

  const [items, setItems] = useState<StoreTransactionRow[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<MyStoresResponse>('/api/me/stores')
      .then((res) => {
        setStores(res.stores)
        if (res.stores.length > 0) setSelectedStoreId(res.stores[0].id)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Falha ao carregar lojas'))
  }, [])

  const fetchPage = useCallback(
    async (storeId: string, type: '' | TransactionType, off: number, replace: boolean) => {
      setLoading(true)
      setError(null)
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (type) qs.set('type', type)
      try {
        const res = await apiClient.get<StoreTransactionsResponse>(
          `/api/stores/${storeId}/transactions?${qs.toString()}`,
        )
        setItems((prev) => (replace ? res.transactions : [...prev, ...res.transactions]))
        setHasMore(res.transactions.length === PAGE_SIZE)
        setOffset(off + res.transactions.length)
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Falha ao carregar extrato')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  // Reset + recarrega quando loja ou tipo mudam
  useEffect(() => {
    if (!selectedStoreId) return
    setItems([])
    setOffset(0)
    setHasMore(false)
    fetchPage(selectedStoreId, typeFilter, 0, true)
  }, [selectedStoreId, typeFilter, fetchPage])

  return (
    <div className="space-y-6">
      {stores && stores.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {stores.map((s) => {
            const active = s.id === selectedStoreId
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setSelectedStoreId(s.id)}
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
      )}

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Extrato</h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Histórico completo de pontuações e resgates desta loja.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          Filtrar:
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as '' | TransactionType)}
            className="rounded-md border border-surface-300 bg-white px-2 py-1 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50"
          >
            <option value="">Todos</option>
            <option value="purchase">Compras</option>
            <option value="redemption">Resgates</option>
            <option value="bonus">Bônus</option>
            <option value="adjustment">Ajustes</option>
            <option value="expiration">Expirações</option>
          </select>
        </label>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {items.length === 0 && !loading ? (
        <p className="rounded-[var(--radius-card)] bg-white p-6 text-center text-sm text-surface-500 shadow-[var(--shadow-card)] dark:bg-surface-900 dark:text-surface-400">
          Nenhuma transação encontrada com esse filtro.
        </p>
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] dark:bg-surface-900">
          <table className="w-full text-sm">
            <thead className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/40 dark:text-surface-400">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 text-right">Pontos</th>
                <th className="px-4 py-3 text-right">Quando</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
              {items.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-surface-900 dark:text-surface-50">
                      {t.customer_name}
                    </div>
                    <div className="text-xs text-surface-500 dark:text-surface-400">
                      {t.customer_email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <TypeBadge type={t.type} />
                    {t.reward_name && (
                      <div className="mt-0.5 text-xs text-surface-500 dark:text-surface-400">
                        {t.reward_name}
                      </div>
                    )}
                    {t.notes && (
                      <div className="mt-0.5 text-xs italic text-surface-400 dark:text-surface-500">
                        {t.notes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <PointsBadge points={t.points} />
                    {t.purchase_amount && (
                      <div className="text-xs text-surface-400 dark:text-surface-500">
                        R$ {t.purchase_amount.toFixed(2).replace('.', ',')}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-surface-500 dark:text-surface-400">
                    {formatDate(t.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => selectedStoreId && fetchPage(selectedStoreId, typeFilter, offset, false)}
            disabled={loading}
            className="rounded-lg border border-surface-300 bg-white px-4 py-2 text-sm font-medium text-surface-700 transition hover:bg-surface-100 disabled:opacity-50 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Badges
// ============================================================

function TypeBadge({ type }: { type: TransactionType }) {
  const styles: Record<TransactionType, string> = {
    purchase: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    redemption: 'bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300',
    bonus: 'bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
    adjustment: 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-200',
    expiration: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300',
  }
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${styles[type]}`}>
      {TYPE_LABELS[type]}
    </span>
  )
}

function PointsBadge({ points }: { points: number }) {
  const positive = points > 0
  return (
    <span
      className={
        'font-semibold ' +
        (positive
          ? 'text-emerald-700 dark:text-emerald-400'
          : 'text-surface-700 dark:text-surface-300')
      }
    >
      {positive ? '+' : ''}
      {points.toLocaleString('pt-BR')}
    </span>
  )
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

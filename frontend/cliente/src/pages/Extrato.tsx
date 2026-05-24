import { useCallback, useEffect, useState } from 'react'

import { ApiError, apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import type {
  BalanceEntry,
  BalanceResponse,
  CustomerTransactionRow,
  CustomerTransactionsResponse,
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
  const { user } = useAuth()

  const [stores, setStores] = useState<BalanceEntry[]>([])
  const [storeFilter, setStoreFilter] = useState<string>('')
  const [items, setItems] = useState<CustomerTransactionRow[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiClient
      .get<BalanceResponse>(`/api/users/${user.id}/balance`)
      .then((res) => setStores(res.balances))
      .catch(() => {
        // sem lojas o filtro fica vazio — nao bloqueia o resto
      })
  }, [user])

  const fetchPage = useCallback(
    async (store: string, off: number, replace: boolean) => {
      setLoading(true)
      setError(null)
      const qs = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(off) })
      if (store) qs.set('store_id', store)
      try {
        const res = await apiClient.get<CustomerTransactionsResponse>(
          `/api/me/transactions?${qs.toString()}`,
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

  useEffect(() => {
    setItems([])
    setOffset(0)
    setHasMore(false)
    fetchPage(storeFilter, 0, true)
  }, [storeFilter, fetchPage])

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-50">Extrato</h2>
          <p className="text-sm text-slate-400">
            Tudo que você ganhou e gastou. Use o filtro pra ver só uma loja.
          </p>
        </div>
        {stores.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-slate-300">
            Loja:
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-50"
            >
              <option value="">Todas</option>
              {stores.map((s) => (
                <option key={s.store_id} value={s.store_id}>
                  {s.store_name}
                </option>
              ))}
            </select>
          </label>
        )}
      </header>

      {error && (
        <div className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</div>
      )}

      {items.length === 0 && !loading ? (
        <div className="rounded-xl bg-slate-900/60 p-8 text-center text-sm text-slate-400 ring-1 ring-white/5">
          {storeFilter
            ? 'Sem transações nessa loja ainda.'
            : 'Você ainda não tem transações registradas.'}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((t) => (
            <TransactionItem key={t.id} tx={t} />
          ))}
        </ul>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={() => fetchPage(storeFilter, offset, false)}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-800 disabled:opacity-50"
          >
            {loading ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================
// Item visual
// ============================================================

function TransactionItem({ tx }: { tx: CustomerTransactionRow }) {
  const positive = tx.points > 0
  return (
    <li className="flex items-center gap-4 rounded-xl bg-slate-900/60 p-4 ring-1 ring-white/5">
      <div
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-white"
        style={{ backgroundColor: tx.store_primary_color ?? '#7c3aed' }}
        aria-hidden
      >
        <TxIcon type={tx.type} />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-50">
          {labelFor(tx)}
        </p>
        <p className="truncate text-xs text-slate-400">
          {tx.store_name} · {formatDate(tx.created_at)}
        </p>
        {tx.notes && (
          <p className="mt-0.5 truncate text-xs italic text-slate-500">{tx.notes}</p>
        )}
      </div>

      <div
        className={
          'shrink-0 text-right font-semibold ' +
          (positive ? 'text-emerald-400' : 'text-slate-300')
        }
      >
        {positive ? '+' : ''}
        {tx.points.toLocaleString('pt-BR')}
        <div className="text-xs font-normal text-slate-500">pts</div>
      </div>
    </li>
  )
}

function labelFor(tx: CustomerTransactionRow): string {
  if (tx.type === 'redemption' && tx.reward_name) {
    return `Resgate: ${tx.reward_name}`
  }
  return TYPE_LABELS[tx.type]
}

function TxIcon({ type }: { type: TransactionType }) {
  const base = {
    xmlns: 'http://www.w3.org/2000/svg',
    fill: 'none',
    viewBox: '0 0 24 24',
    strokeWidth: 1.75,
    stroke: 'currentColor',
    className: 'h-5 w-5',
  }
  if (type === 'redemption') {
    return (
      <svg {...base}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
      </svg>
    )
  }
  // purchase / bonus / adjustment / expiration → plus/minus simples
  return (
    <svg {...base}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
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

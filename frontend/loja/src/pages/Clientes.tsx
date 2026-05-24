import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, apiClient } from '@/api/client'
import type {
  MyStoresResponse,
  Store,
  StoreMemberRow,
  StoreMembersResponse,
} from '@/types/api'

type SortKey = 'balance' | 'name' | 'last_activity'

export default function ClientesPage() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [members, setMembers] = useState<StoreMemberRow[] | null>(null)
  const [query, setQuery] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('balance')
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    apiClient
      .get<MyStoresResponse>('/api/me/stores')
      .then((res) => {
        setStores(res.stores)
        if (res.stores.length > 0) setSelectedStoreId(res.stores[0].id)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar lojas'))
  }, [])

  const loadMembers = useCallback((storeId: string) => {
    setMembers(null)
    apiClient
      .get<StoreMembersResponse>(`/api/stores/${storeId}/members`)
      .then((res) => setMembers(res.members))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar clientes'))
  }, [])

  useEffect(() => {
    if (!selectedStoreId) return
    loadMembers(selectedStoreId)
  }, [selectedStoreId, loadMembers])

  // Filtro + ordenacao local (sem refetch)
  const visible = useMemo(() => {
    if (!members) return []
    const q = query.trim().toLowerCase()
    const filtered = q
      ? members.filter(
          (m) =>
            m.customer_name.toLowerCase().includes(q) ||
            m.customer_email.toLowerCase().includes(q),
        )
      : members
    const sorted = [...filtered]
    switch (sortKey) {
      case 'name':
        sorted.sort((a, b) => a.customer_name.localeCompare(b.customer_name))
        break
      case 'last_activity':
        sorted.sort(
          (a, b) => new Date(b.last_activity_at).getTime() - new Date(a.last_activity_at).getTime(),
        )
        break
      case 'balance':
      default:
        sorted.sort((a, b) => b.points_balance - a.points_balance)
    }
    return sorted
  }, [members, query, sortKey])

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

      <header>
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">Clientes</h2>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Clientes com pontos nesta loja. {members ? `${members.length} no total.` : ''}
        </p>
      </header>

      {loadError && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {loadError}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          type="search"
          placeholder="Buscar por nome ou email…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-lg border border-surface-300 bg-white px-3 py-2 text-sm text-surface-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50 sm:max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
          <span>Ordenar:</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-surface-300 bg-white px-2 py-1 text-sm dark:border-surface-700 dark:bg-surface-900 dark:text-surface-50"
          >
            <option value="balance">Saldo (maior primeiro)</option>
            <option value="last_activity">Última atividade</option>
            <option value="name">Nome (A–Z)</option>
          </select>
        </div>
      </div>

      {members === null ? (
        <p className="text-sm text-surface-500">Carregando…</p>
      ) : visible.length === 0 ? (
        <p className="rounded-[var(--radius-card)] bg-white p-6 text-center text-sm text-surface-500 shadow-[var(--shadow-card)] dark:bg-surface-900 dark:text-surface-400">
          {query
            ? `Nenhum cliente bate com "${query}".`
            : 'Nenhum cliente com pontos nesta loja ainda.'}
        </p>
      ) : (
        <MembersTable rows={visible} />
      )}
    </div>
  )
}

function MembersTable({ rows }: { rows: StoreMemberRow[] }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] dark:bg-surface-900">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/40 dark:text-surface-400">
          <tr>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3 text-right">Saldo</th>
            <th className="px-4 py-3 text-right">Ganhos</th>
            <th className="px-4 py-3 text-right">Resgatados</th>
            <th className="px-4 py-3 text-right">Última atividade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
          {rows.map((m) => (
            <tr key={m.customer_id}>
              <td className="px-4 py-3">
                <div className="font-medium text-surface-900 dark:text-surface-50">
                  {m.customer_name}
                </div>
                <div className="text-xs text-surface-500 dark:text-surface-400">
                  {m.customer_email}
                  {m.customer_phone && ` · ${m.customer_phone}`}
                </div>
              </td>
              <td className="px-4 py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                {m.points_balance.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right text-emerald-700 dark:text-emerald-400">
                +{m.lifetime_earned.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right text-surface-500 dark:text-surface-400">
                −{m.lifetime_redeemed.toLocaleString('pt-BR')}
              </td>
              <td className="px-4 py-3 text-right text-surface-500 dark:text-surface-400">
                {timeAgo(m.last_activity_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const sec = Math.floor(diffMs / 1000)
  if (sec < 60) return 'agora'
  const min = Math.floor(sec / 60)
  if (min < 60) return `há ${min} min`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `há ${hr}h`
  const days = Math.floor(hr / 24)
  if (days === 1) return 'ontem'
  if (days < 7) return `há ${days} dias`
  if (days < 30) return `há ${Math.floor(days / 7)} semanas`
  if (days < 365) return `há ${Math.floor(days / 30)} meses`
  return `há ${Math.floor(days / 365)} anos`
}

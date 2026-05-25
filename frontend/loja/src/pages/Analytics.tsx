import { useEffect, useMemo, useState } from 'react'

import { ApiError, apiClient } from '@/api/client'
import type { DailyPoints, MyStoresResponse, Store, StoreStats } from '@/types/api'

export default function AnalyticsPage() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [stats, setStats] = useState<StoreStats | null>(null)
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

  useEffect(() => {
    if (!selectedStoreId) return
    setStats(null)
    apiClient
      .get<StoreStats>(`/api/stores/${selectedStoreId}/stats`)
      .then(setStats)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Falha ao carregar estatísticas'))
  }, [selectedStoreId])

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
        <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
          Visão geral da loja
        </h2>
        <p className="text-sm text-surface-500 dark:text-surface-400">
          Indicadores agregados e tendência dos últimos 30 dias.
        </p>
      </header>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!stats ? (
        <div className="rounded-[var(--radius-card)] bg-white p-12 text-center text-sm text-surface-500 shadow-[var(--shadow-card)] dark:bg-surface-900">
          Carregando…
        </div>
      ) : (
        <>
          <KPIGrid kpis={stats.kpis} />
          <TimelineCard daily={stats.points_per_day} />
          <div className="grid gap-4 md:grid-cols-2">
            <TopCustomersCard list={stats.top_customers} />
            <TopRewardsCard list={stats.top_rewards} />
          </div>
        </>
      )}
    </div>
  )
}

// ============================================================
// KPI cards
// ============================================================

function KPIGrid({ kpis }: { kpis: StoreStats['kpis'] }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <KPI label="Clientes" value={kpis.total_customers} />
      <KPI label="Pontos creditados (vida)" value={kpis.total_points_credited} accent />
      <KPI label="Pontos resgatados (vida)" value={kpis.total_points_redeemed} />
      <KPI label="Recompensas ativas" value={kpis.active_rewards} />
    </div>
  )
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white p-5 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <p className="text-xs font-medium uppercase tracking-wider text-surface-500 dark:text-surface-400">
        {label}
      </p>
      <p
        className={
          'mt-2 text-2xl font-semibold ' +
          (accent ? 'text-brand-600 dark:text-brand-400' : 'text-surface-900 dark:text-surface-50')
        }
      >
        {value.toLocaleString('pt-BR')}
      </p>
    </div>
  )
}

// ============================================================
// Timeline (gráfico SVG)
// ============================================================

function TimelineCard({ daily }: { daily: DailyPoints[] }) {
  const max = useMemo(
    () => Math.max(1, ...daily.map((d) => Math.max(d.credited, d.redeemed))),
    [daily],
  )
  const totalCredited = daily.reduce((sum, d) => sum + d.credited, 0)
  const totalRedeemed = daily.reduce((sum, d) => sum + d.redeemed, 0)

  return (
    <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
            Últimos 30 dias
          </h3>
          <p className="text-xs text-surface-500 dark:text-surface-400">
            Pontos creditados e resgatados por dia.
          </p>
        </div>
        <div className="flex gap-4 text-xs">
          <LegendDot color="bg-emerald-500" label={`Creditados · ${totalCredited.toLocaleString('pt-BR')}`} />
          <LegendDot color="bg-rose-400" label={`Resgatados · ${totalRedeemed.toLocaleString('pt-BR')}`} />
        </div>
      </header>

      <BarChart daily={daily} max={max} />

      <div className="mt-2 flex justify-between text-xs text-surface-400 dark:text-surface-500">
        <span>{formatShort(daily[0]?.date)}</span>
        <span>{formatShort(daily[daily.length - 1]?.date)}</span>
      </div>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-300">
      <span className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
      {label}
    </span>
  )
}

function BarChart({ daily, max }: { daily: DailyPoints[]; max: number }) {
  const W = 600
  const H = 180
  const slot = W / daily.length // largura por dia
  const barW = Math.max(2, slot / 2 - 1) // largura de cada barra (creditados / resgatados)

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="Pontos creditados e resgatados por dia"
      className="h-44 w-full"
    >
      {/* Linha base */}
      <line x1={0} y1={H} x2={W} y2={H} stroke="currentColor" strokeOpacity={0.1} />

      {daily.map((d, i) => {
        const x = i * slot
        const credH = (d.credited / max) * (H - 4)
        const redH = (d.redeemed / max) * (H - 4)
        const tip = `${formatShort(d.date)} · creditados: ${d.credited} · resgatados: ${d.redeemed}`
        return (
          <g key={d.date}>
            {/* creditados — emerald */}
            <rect
              x={x + 1}
              y={H - credH}
              width={barW}
              height={credH}
              rx={1}
              className="fill-emerald-500"
            >
              <title>{tip}</title>
            </rect>
            {/* resgatados — rose, ao lado */}
            <rect
              x={x + 1 + barW + 1}
              y={H - redH}
              width={barW}
              height={redH}
              rx={1}
              className="fill-rose-400"
            >
              <title>{tip}</title>
            </rect>
          </g>
        )
      })}
    </svg>
  )
}

// ============================================================
// Top customers / rewards
// ============================================================

function TopCustomersCard({ list }: { list: StoreStats['top_customers'] }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
        Top clientes
      </h3>
      <p className="text-xs text-surface-500 dark:text-surface-400">Por saldo atual.</p>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">
          Nenhum cliente ainda.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {list.map((c, i) => (
            <li
              key={c.customer_id}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-800/50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                  {i + 1}
                </span>
                <span className="truncate text-sm text-surface-900 dark:text-surface-50">
                  {c.name}
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-brand-600 dark:text-brand-400">
                {c.points_balance.toLocaleString('pt-BR')} pts
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function TopRewardsCard({ list }: { list: StoreStats['top_rewards'] }) {
  return (
    <div className="rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900">
      <h3 className="text-base font-semibold text-surface-900 dark:text-surface-50">
        Top recompensas
      </h3>
      <p className="text-xs text-surface-500 dark:text-surface-400">
        Mais resgatadas no histórico.
      </p>

      {list.length === 0 ? (
        <p className="mt-4 text-sm text-surface-500 dark:text-surface-400">
          Nenhum resgate ainda.
        </p>
      ) : (
        <ol className="mt-4 space-y-2">
          {list.map((r, i) => (
            <li
              key={r.reward_id}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-50 px-3 py-2 dark:bg-surface-800/50"
            >
              <span className="flex min-w-0 items-center gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-rose-100 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-surface-900 dark:text-surface-50">
                    {r.name}
                  </span>
                  <span className="block text-xs text-surface-500 dark:text-surface-400">
                    {r.points_cost.toLocaleString('pt-BR')} pts por resgate
                  </span>
                </span>
              </span>
              <span className="shrink-0 text-sm font-semibold text-rose-600 dark:text-rose-400">
                {r.redemption_count}×
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

// ============================================================
// Format helpers
// ============================================================

function formatShort(iso?: string): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

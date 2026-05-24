import { useCallback, useEffect, useMemo, useState } from 'react'

import { ApiError, apiClient } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import LoyaltyCard3D from '@/components/LoyaltyCard3D'
import type {
  BalanceEntry,
  BalanceResponse,
  RedeemResponse,
  Reward,
  RewardsResponse,
} from '@/types/api'

export default function DashboardPage() {
  const { user } = useAuth()

  const [balances, setBalances] = useState<BalanceEntry[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [redeemingId, setRedeemingId] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    apiClient
      .get<BalanceResponse>(`/api/users/${user.id}/balance`)
      .then((res) => {
        setBalances(res.balances)
        if (res.balances.length > 0) setSelectedStoreId(res.balances[0].store_id)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar saldo'))
  }, [user])

  const loadRewards = useCallback((storeId: string) => {
    apiClient
      .get<RewardsResponse>(`/api/stores/${storeId}/rewards`)
      .then((res) => setRewards(res.rewards))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar recompensas'))
  }, [])

  useEffect(() => {
    if (!selectedStoreId) {
      setRewards([])
      return
    }
    loadRewards(selectedStoreId)
  }, [selectedStoreId, loadRewards])

  const selected = useMemo(
    () => balances?.find((b) => b.store_id === selectedStoreId) ?? null,
    [balances, selectedStoreId],
  )

  async function redeem(reward: Reward) {
    if (!selected) return
    setActionError(null)
    setRedeemingId(reward.id)
    try {
      const res = await apiClient.post<RedeemResponse>(
        `/api/stores/${selected.store_id}/redemptions`,
        { reward_id: reward.id },
      )
      setBalances((prev) =>
        prev?.map((b) =>
          b.store_id === selected.store_id
            ? {
                ...b,
                points_balance: res.membership.points_balance,
                lifetime_redeemed: res.membership.lifetime_redeemed,
                last_activity_at: res.membership.last_activity_at,
              }
            : b,
        ) ?? null,
      )
      loadRewards(selected.store_id)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro inesperado.')
    } finally {
      setRedeemingId(null)
    }
  }

  return (
    <div className="space-y-8">
      {loadError && (
        <div className="rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-200">{loadError}</div>
      )}

      {/* Hero: LoyaltyCard3D */}
      {selected ? (
        <section className="overflow-hidden rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/60 ring-1 ring-white/5">
          <LoyaltyCard3D
            storeName={selected.store_name}
            customerName={user?.name ?? ''}
            points={selected.points_balance}
            accentColor={selected.store_primary_color ?? '#7c3aed'}
            className="h-[440px] w-full"
          />
        </section>
      ) : balances === null ? (
        <CardSkeleton />
      ) : (
        <EmptyState />
      )}

      {balances && balances.length > 1 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
            Suas lojas
          </h2>
          <div className="flex flex-wrap gap-2">
            {balances.map((b) => {
              const active = b.store_id === selectedStoreId
              return (
                <button
                  key={b.store_id}
                  type="button"
                  onClick={() => setSelectedStoreId(b.store_id)}
                  className={
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition ' +
                    (active
                      ? 'border-violet-500 bg-violet-600 text-white'
                      : 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800')
                  }
                >
                  {b.store_name}
                  <span className="ml-2 text-xs opacity-75">
                    {b.points_balance.toLocaleString('pt-BR')} pts
                  </span>
                </button>
              )
            })}
          </div>
        </section>
      )}

      {selected && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wider text-slate-400">
            Recompensas em {selected.store_name}
          </h2>

          {actionError && (
            <div className="mb-3 rounded-lg bg-red-950/40 px-4 py-3 text-sm text-red-200">
              {actionError}
            </div>
          )}

          {rewards.length === 0 ? (
            <p className="rounded-xl bg-slate-900/60 px-4 py-6 text-sm text-slate-400 ring-1 ring-white/5">
              Nenhuma recompensa disponível no momento.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {rewards.map((r) => {
                const canAfford = selected.points_balance >= r.points_cost
                const busy = redeemingId === r.id
                return (
                  <article
                    key={r.id}
                    className="flex flex-col justify-between rounded-xl bg-slate-900/60 p-5 ring-1 ring-white/5 transition hover:ring-white/10"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-100">{r.name}</h3>
                      {r.description && (
                        <p className="mt-1 text-sm text-slate-400">{r.description}</p>
                      )}
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="text-lg font-semibold text-violet-400">
                        {r.points_cost.toLocaleString('pt-BR')}
                        <span className="ml-1 text-xs font-normal text-slate-400">pts</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => redeem(r)}
                        disabled={!canAfford || busy}
                        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
                      >
                        {busy ? 'Resgatando…' : canAfford ? 'Resgatar' : 'Saldo insuficiente'}
                      </button>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="grid h-[440px] place-items-center rounded-2xl bg-slate-900/60 ring-1 ring-white/5">
      <p className="text-slate-500">Carregando seu saldo…</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="grid h-[440px] place-items-center rounded-2xl bg-slate-900/60 px-6 text-center ring-1 ring-white/5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Você ainda não tem pontos</h2>
        <p className="mt-2 max-w-md text-sm text-slate-400">
          Peça ao lojista para registrar uma compra usando o email da sua conta. Assim que ele
          pontuar, sua carteira aparece aqui.
        </p>
      </div>
    </div>
  )
}

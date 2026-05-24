import { useCallback, useEffect, useState, type FormEvent } from 'react'

import { ApiError, apiClient } from '@/api/client'
import type {
  MyStoresResponse,
  Reward,
  RewardPayload,
  RewardsListResponse,
  Store,
} from '@/types/api'

type EditingState = null | 'new' | Reward

export default function RewardsPage() {
  const [stores, setStores] = useState<Store[] | null>(null)
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(null)
  const [rewards, setRewards] = useState<Reward[] | null>(null)
  const [editing, setEditing] = useState<EditingState>(null)

  const [loadError, setLoadError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Carrega lojas no mount
  useEffect(() => {
    apiClient
      .get<MyStoresResponse>('/api/me/stores')
      .then((res) => {
        setStores(res.stores)
        if (res.stores.length > 0) setSelectedStoreId(res.stores[0].id)
      })
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar lojas'))
  }, [])

  const loadRewards = useCallback((storeId: string) => {
    apiClient
      .get<RewardsListResponse>(`/api/stores/${storeId}/rewards/admin`)
      .then((res) => setRewards(res.rewards))
      .catch((err) => setLoadError(err instanceof ApiError ? err.message : 'Falha ao carregar recompensas'))
  }, [])

  useEffect(() => {
    if (!selectedStoreId) return
    loadRewards(selectedStoreId)
  }, [selectedStoreId, loadRewards])

  async function handleSave(payload: RewardPayload) {
    if (!selectedStoreId) return
    setActionError(null)
    try {
      if (editing === 'new') {
        await apiClient.post<Reward>(`/api/stores/${selectedStoreId}/rewards`, payload)
      } else if (editing && editing !== null) {
        await apiClient.request<Reward>('PATCH', `/api/stores/${selectedStoreId}/rewards/${editing.id}`, payload)
      }
      setEditing(null)
      loadRewards(selectedStoreId)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro ao salvar.')
    }
  }

  async function handleDelete(reward: Reward) {
    if (!selectedStoreId) return
    if (!confirm(`Desativar "${reward.name}"? (clientes deixam de ver a recompensa, mas o histórico fica preservado)`)) {
      return
    }
    setDeletingId(reward.id)
    setActionError(null)
    try {
      await apiClient.request('DELETE', `/api/stores/${selectedStoreId}/rewards/${reward.id}`)
      loadRewards(selectedStoreId)
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Erro ao desativar.')
    } finally {
      setDeletingId(null)
    }
  }

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

      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-surface-900 dark:text-surface-50">
            Recompensas
          </h2>
          <p className="text-sm text-surface-500 dark:text-surface-400">
            Inclui ativas, inativas e expiradas. O cliente só vê as ativas dentro da janela.
          </p>
        </div>
        {editing === null && (
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            + Nova recompensa
          </button>
        )}
      </header>

      {loadError && <ErrorBanner message={loadError} />}
      {actionError && <ErrorBanner message={actionError} />}

      {editing !== null && (
        <RewardForm
          initial={editing === 'new' ? null : editing}
          onCancel={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {rewards === null ? (
        <p className="text-sm text-surface-500">Carregando…</p>
      ) : rewards.length === 0 ? (
        <p className="rounded-[var(--radius-card)] bg-white p-6 text-center text-sm text-surface-500 shadow-[var(--shadow-card)] dark:bg-surface-900 dark:text-surface-400">
          Nenhuma recompensa cadastrada ainda.
        </p>
      ) : (
        <RewardsTable
          rewards={rewards}
          onEdit={setEditing}
          onDelete={handleDelete}
          deletingId={deletingId}
        />
      )}
    </div>
  )
}

// ============================================================
// Tabela
// ============================================================

function RewardsTable({
  rewards,
  onEdit,
  onDelete,
  deletingId,
}: {
  rewards: Reward[]
  onEdit: (r: Reward) => void
  onDelete: (r: Reward) => void
  deletingId: string | null
}) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-card)] bg-white shadow-[var(--shadow-card)] dark:bg-surface-900">
      <table className="w-full text-sm">
        <thead className="border-b border-surface-200 bg-surface-50 text-left text-xs font-semibold uppercase tracking-wider text-surface-500 dark:border-surface-800 dark:bg-surface-800/40 dark:text-surface-400">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3 text-right">Custo</th>
            <th className="px-4 py-3 text-right">Estoque</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
          {rewards.map((r) => (
            <tr key={r.id} className={r.active ? '' : 'opacity-60'}>
              <td className="px-4 py-3">
                <div className="font-medium text-surface-900 dark:text-surface-50">{r.name}</div>
                {r.description && (
                  <div className="text-xs text-surface-500 dark:text-surface-400">{r.description}</div>
                )}
              </td>
              <td className="px-4 py-3 text-right font-semibold text-brand-600 dark:text-brand-400">
                {r.points_cost.toLocaleString('pt-BR')} pts
              </td>
              <td className="px-4 py-3 text-right text-surface-700 dark:text-surface-200">
                {r.stock === null || r.stock === undefined ? '∞' : r.stock}
              </td>
              <td className="px-4 py-3">
                <StatusBadge reward={r} />
              </td>
              <td className="px-4 py-3 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    className="rounded-md border border-surface-300 px-3 py-1 text-xs font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
                  >
                    Editar
                  </button>
                  {r.active && (
                    <button
                      type="button"
                      onClick={() => onDelete(r)}
                      disabled={deletingId === r.id}
                      className="rounded-md border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-300 dark:hover:bg-red-950/30"
                    >
                      {deletingId === r.id ? 'Desativando…' : 'Desativar'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ reward }: { reward: Reward }) {
  const now = new Date()
  let label = 'Ativa'
  let cls = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'

  if (!reward.active) {
    label = 'Inativa'
    cls = 'bg-surface-200 text-surface-700 dark:bg-surface-800 dark:text-surface-300'
  } else if (reward.expires_at && new Date(reward.expires_at) <= now) {
    label = 'Expirada'
    cls = 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
  } else if (reward.starts_at && new Date(reward.starts_at) > now) {
    label = 'Agendada'
    cls = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  } else if (reward.stock !== null && reward.stock !== undefined && reward.stock <= 0) {
    label = 'Sem estoque'
    cls = 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
  }
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{label}</span>
}

// ============================================================
// Form de criar/editar
// ============================================================

function RewardForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Reward | null
  onSave: (payload: RewardPayload) => Promise<void>
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? '')
  const [pointsCost, setPointsCost] = useState<number | ''>(initial?.points_cost ?? '')
  const [stock, setStock] = useState<number | ''>(
    initial?.stock === undefined || initial?.stock === null ? '' : initial.stock,
  )
  const [active, setActive] = useState<boolean>(initial?.active ?? true)
  const [startsAt, setStartsAt] = useState<string>(toLocalInput(initial?.starts_at))
  const [expiresAt, setExpiresAt] = useState<string>(toLocalInput(initial?.expires_at))
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (typeof pointsCost !== 'number' || pointsCost <= 0) return
    setSubmitting(true)
    try {
      await onSave({
        name: name.trim(),
        description: description.trim() || null,
        image_url: imageUrl.trim() || null,
        points_cost: pointsCost,
        stock: stock === '' ? null : stock,
        active,
        starts_at: startsAt ? new Date(startsAt).toISOString() : null,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-[var(--radius-card)] bg-white p-6 shadow-[var(--shadow-card)] dark:bg-surface-900"
    >
      <h3 className="text-sm font-semibold uppercase tracking-wider text-surface-500 dark:text-surface-400">
        {initial ? 'Editar recompensa' : 'Nova recompensa'}
      </h3>

      <FormField label="Nome" type="text" required value={name} onChange={setName} />
      <FormField label="Descrição" type="text" value={description} onChange={setDescription} placeholder="opcional" />
      <FormField label="URL da imagem" type="text" value={imageUrl} onChange={setImageUrl} placeholder="opcional" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Custo (pontos)"
          type="number"
          required
          min={1}
          value={pointsCost === '' ? '' : String(pointsCost)}
          onChange={(v) => setPointsCost(v === '' ? '' : Number(v))}
        />
        <FormField
          label="Estoque"
          type="number"
          min={0}
          value={stock === '' ? '' : String(stock)}
          onChange={(v) => setStock(v === '' ? '' : Number(v))}
          placeholder="vazio = ilimitado"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Início (opcional)"
          type="datetime-local"
          value={startsAt}
          onChange={setStartsAt}
        />
        <FormField
          label="Expiração (opcional)"
          type="datetime-local"
          value={expiresAt}
          onChange={setExpiresAt}
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-surface-700 dark:text-surface-200">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="h-4 w-4 rounded border-surface-300 text-brand-600 focus:ring-brand-500/40"
        />
        Ativa (visível para clientes)
      </label>

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-surface-300 px-4 py-2 text-sm font-medium text-surface-700 hover:bg-surface-100 dark:border-surface-700 dark:text-surface-200 dark:hover:bg-surface-800"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Salvando…' : initial ? 'Salvar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}

type FormFieldProps = {
  label: string
  type: 'text' | 'number' | 'datetime-local'
  value: string
  onChange: (v: string) => void
  required?: boolean
  min?: number
  placeholder?: string
}

function FormField({ label, type, value, onChange, required, min, placeholder }: FormFieldProps) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-surface-700 dark:text-surface-200">{label}</span>
      <input
        type={type}
        required={required}
        min={min}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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

// ============================================================
// Helpers
// ============================================================

/** Converte ISO do backend para o formato que <input type="datetime-local"> espera. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

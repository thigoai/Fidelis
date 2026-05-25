import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet } from 'react-router'

import { useAuth } from '@/auth/AuthContext'
import type { User } from '@/types/api'

export function Layout() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-950">
      <header className="sticky top-0 z-10 border-b border-surface-200/80 bg-white/80 backdrop-blur-md dark:border-surface-800/80 dark:bg-surface-900/80">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link
              to="/dashboard"
              className="group flex items-center gap-3"
              aria-label="Ir para o painel"
            >
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-[0_4px_12px_-4px_rgba(124,58,237,0.5)] transition group-hover:scale-105">
                <span className="font-display text-lg font-bold leading-none">F</span>
              </div>
              <div className="leading-tight">
                <p className="text-base font-semibold text-surface-900 dark:text-surface-50">
                  Fidelis
                </p>
                <p className="text-xs text-surface-500 dark:text-surface-400">Painel da Loja</p>
              </div>
            </Link>

            {user && <UserMenu user={user} onLogout={logout} />}
          </div>

          <nav className="-mx-2 flex gap-1 overflow-x-auto pb-2">
            <Tab to="/dashboard" icon={<PlusCircleIcon />}>Pontuar</Tab>
            <Tab to="/analytics" icon={<ChartBarIcon />}>Análise</Tab>
            <Tab to="/rewards" icon={<GiftIcon />}>Recompensas</Tab>
            <Tab to="/clientes" icon={<UsersIcon />}>Clientes</Tab>
            <Tab to="/extrato" icon={<ReceiptIcon />}>Extrato</Tab>
            <Tab to="/perfil" icon={<UserCircleIcon />}>Perfil</Tab>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-6">
        <Outlet />
      </main>
    </div>
  )
}

function Tab({ to, icon, children }: { to: string; icon: ReactNode; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        'shrink-0 inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium transition ' +
        (isActive
          ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/20'
          : 'text-surface-600 hover:bg-surface-100 hover:text-surface-900 dark:text-surface-300 dark:hover:bg-surface-800 dark:hover:text-surface-50')
      }
    >
      <span className="grid h-4 w-4 place-items-center">{icon}</span>
      {children}
    </NavLink>
  )
}

function UserMenu({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  useEffect(() => {
    if (!open) return
    function handle(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-full p-1 pr-2 transition hover:bg-surface-100 sm:pr-3 dark:hover:bg-surface-800"
      >
        <Avatar name={user.name} />
        <span className="hidden text-sm font-medium text-surface-700 sm:inline dark:text-surface-200">
          {firstName(user.name)}
        </span>
        <span className="hidden h-4 w-4 text-surface-400 sm:inline">
          <ChevronDownIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-60 overflow-hidden rounded-xl border border-surface-200 bg-white shadow-xl dark:border-surface-700 dark:bg-surface-900"
        >
          <div className="border-b border-surface-200 px-4 py-3 dark:border-surface-800">
            <p className="truncate text-sm font-semibold text-surface-900 dark:text-surface-50">
              {user.name}
            </p>
            <p className="truncate text-xs text-surface-500 dark:text-surface-400">{user.email}</p>
          </div>
          <Link
            to="/perfil"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-surface-700 transition hover:bg-surface-100 dark:text-surface-200 dark:hover:bg-surface-800"
          >
            <span className="h-4 w-4 text-surface-500"><UserCircleIcon /></span>
            Perfil
          </Link>
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              onLogout()
            }}
            className="flex w-full items-center gap-2 border-t border-surface-200 px-4 py-2.5 text-sm text-red-600 transition hover:bg-red-50 dark:border-surface-800 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <span className="h-4 w-4"><LogoutIcon /></span>
            Sair
          </button>
        </div>
      )}
    </div>
  )
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-semibold text-white ring-2 ring-white shadow-sm dark:ring-surface-900">
      {getInitials(name)}
    </div>
  )
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function firstName(name: string): string {
  const trimmed = name.trim()
  return trimmed ? trimmed.split(/\s+/)[0] : ''
}

// ============================================================
// Icons
// ============================================================

const iconBase = {
  xmlns: 'http://www.w3.org/2000/svg',
  fill: 'none',
  viewBox: '0 0 24 24',
  strokeWidth: 1.75,
  stroke: 'currentColor',
  className: 'h-full w-full',
}

function PlusCircleIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v6m3-3H9m12 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
  )
}

function ChartBarIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  )
}

function ReceiptIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25M8.25 8.25H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25Z" />
    </svg>
  )
}

function UserCircleIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg {...iconBase}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15m3 0 3-3m0 0-3-3m3 3H9" />
    </svg>
  )
}

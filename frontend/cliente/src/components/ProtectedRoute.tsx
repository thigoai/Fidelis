import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import type { UserRole } from '@/types/api'

type Props = {
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: Props) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-slate-400">
        Carregando…
      </div>
    )
  }
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (roles && !roles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-slate-300">
        <div>
          <p className="text-sm font-medium text-red-400">403</p>
          <h1 className="mt-1 text-xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-slate-500">
            Este app é para clientes. Use o painel da loja se você é lojista.
          </p>
        </div>
      </div>
    )
  }
  return <Outlet />
}

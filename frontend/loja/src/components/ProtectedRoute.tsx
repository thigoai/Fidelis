import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '@/auth/AuthContext'
import type { UserRole } from '@/types/api'

type Props = {
  /** Se fornecido, alem de autenticado, o usuario deve ter um dos roles listados. */
  roles?: UserRole[]
}

export function ProtectedRoute({ roles }: Props) {
  const { user, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center text-surface-500 dark:text-surface-400">
        Carregando…
      </div>
    )
  }

  if (!user) {
    // Guarda o destino original para voltar apos login
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="grid min-h-screen place-items-center px-6 text-center text-surface-700 dark:text-surface-200">
        <div>
          <p className="text-sm font-medium text-red-600 dark:text-red-400">403</p>
          <h1 className="mt-1 text-xl font-semibold">Acesso negado</h1>
          <p className="mt-2 text-surface-500 dark:text-surface-400">
            Esta área não está disponível para o perfil {user.role}.
          </p>
        </div>
      </div>
    )
  }

  return <Outlet />
}

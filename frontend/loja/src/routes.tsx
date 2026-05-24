import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AuthProvider } from '@/auth/AuthContext'
import { Layout } from '@/components/Layout'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import ClientesPage from '@/pages/Clientes'
import DashboardPage from '@/pages/Dashboard'
import ExtratoPage from '@/pages/Extrato'
import LoginPage from '@/pages/Login'
import PerfilPage from '@/pages/Perfil'
import RegisterPage from '@/pages/Register'
import RewardsPage from '@/pages/Rewards'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route element={<ProtectedRoute roles={['lojista', 'admin']} />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/extrato" element={<ExtratoPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import type { UserRole } from './hooks/useAuth'
import AppHome from './pages/AppHome'
import CoordinatorHome from './pages/CoordinatorHome'
import CreateShift from './pages/CreateShift'
import Landing from './pages/Landing'
import Roster from './pages/Roster'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

const homeForRole: Record<UserRole, string> = {
  volunteer: '/app',
  coordinator: '/coordinator',
}

function ProtectedRoute({ children, role }: { children: ReactNode; role?: UserRole }) {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-sm text-muted">
        Loading…
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/signin" replace />
  }

  if (role && profile?.role !== role) {
    return <Navigate to={profile ? homeForRole[profile.role] : '/signin'} replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signin" element={<SignIn />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator"
          element={
            <ProtectedRoute role="coordinator">
              <CoordinatorHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/create-shift"
          element={
            <ProtectedRoute role="coordinator">
              <CreateShift />
            </ProtectedRoute>
          }
        />
        <Route
          path="/coordinator/shifts/:shiftId/roster"
          element={
            <ProtectedRoute role="coordinator">
              <Roster />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App

import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import AppHome from './pages/AppHome'
import Landing from './pages/Landing'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()

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
      </Routes>
    </BrowserRouter>
  )
}

export default App

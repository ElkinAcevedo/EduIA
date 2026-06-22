import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Sidebar from './components/Sidebar'
import { AuthProvider, useAuth } from './context/AuthContext'

import DashboardView  from './views/DashboardView'
import StudentsView   from './views/StudentsView'
import AssistantView  from './views/AssistantView'
import AdapterView    from './views/AdapterView'
import LogbookView    from './views/LogbookView'
import BankView       from './views/BankView'
import LoginView      from './views/LoginView'
import RegisterView   from './views/RegisterView'

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 font-jakarta">
      <Sidebar />
      <main className="lg:pl-64 min-h-screen flex flex-col">
        <div className="flex-1 p-6 lg:p-8 pt-16 lg:pt-8">
          <Routes>
            <Route path="/"          element={<DashboardView />} />
            <Route path="/students"  element={<StudentsView />}  />
            <Route path="/assistant" element={<AssistantView />} />
            <Route path="/adapter"   element={<AdapterView />}   />
            <Route path="/logbook"   element={<LogbookView />}   />
            <Route path="/bank"      element={<BankView />}      />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return null

  if (isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><LoginView /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterView /></PublicRoute>} />
      <Route path="/*" element={<ProtectedRoute><AppLayout /></ProtectedRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

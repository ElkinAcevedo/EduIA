import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, LogIn, AlertCircle, Brain } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function LoginView() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState(null)
  const [loading, setLoading]   = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      setError('Completa email y contraseña.')
      return
    }

    setLoading(true)
    setError(null)

    api.post('/auth/login/', { email: email.trim(), password })
      .then(({ data }) => {
        login({ access: data.access, refresh: data.refresh }, data.usuario)
        navigate('/')
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          setError('Email o contraseña incorrectos.')
        } else {
          setError('No se pudo iniciar sesión. Intenta de nuevo.')
        }
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
            <Brain size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
            EduIA
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">TDAH</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_24px_rgba(15,23,42,0.08)] p-7">
          <h2 className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Bienvenido de vuelta
          </h2>
          <p className="text-sm text-slate-400 mb-6">Ingresa a tu cuenta de docente</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="profesor@colegio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200 disabled:opacity-60"
            >
              {loading ? (
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                </svg>
              ) : (
                <LogIn size={14} strokeWidth={2} />
              )}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  )
}

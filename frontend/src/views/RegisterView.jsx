import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Mail, Lock, User, School, GraduationCap, UserPlus, AlertCircle, Brain } from 'lucide-react'
import api from '../api'
import { useAuth } from '../context/AuthContext'

export default function RegisterView() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    colegio: '',
    grado_asignado: '',
  })
  const [error, setError]     = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  function handleSubmit(e) {
    e.preventDefault()

    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      setError('Nombre, email y contraseña son obligatorios.')
      return
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }

    setLoading(true)
    setError(null)

    api.post('/auth/register/', {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      password: form.password,
      colegio: form.colegio.trim(),
      grado_asignado: form.grado_asignado.trim(),
    })
      .then(({ data }) => {
        login({ access: data.access, refresh: data.refresh }, data.usuario)
        navigate('/')
      })
      .catch((err) => {
        const detalle = err.response?.data
        if (detalle?.email) {
          setError('Ese email ya está registrado.')
        } else {
          setError('No se pudo crear la cuenta. Intenta de nuevo.')
        }
      })
      .finally(() => setLoading(false))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm">

        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-200 mb-3">
            <Brain size={24} strokeWidth={2} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
            EduIA
          </h1>
          <p className="text-xs text-slate-400 font-medium tracking-wide">TDAH</p>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-[0_2px_24px_rgba(15,23,42,0.08)] p-7">
          <h2 className="text-lg font-bold text-slate-800 mb-1" style={{ fontFamily: "'Poppins', sans-serif" }}>
            Crea tu cuenta
          </h2>
          <p className="text-sm text-slate-400 mb-6">Empieza a gestionar tu aula con IA</p>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
              <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
              <p className="text-xs text-red-600 font-medium">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Nombre completo <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="nombre"
                  type="text"
                  value={form.nombre}
                  onChange={handleChange}
                  placeholder="Ej: Carlos Ruiz"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Mail size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="profesor@colegio.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Contraseña <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Lock size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Colegio</label>
                <div className="relative">
                  <School size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="colegio"
                    type="text"
                    value={form.colegio}
                    onChange={handleChange}
                    placeholder="Ej: San José"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Grado</label>
                <div className="relative">
                  <GraduationCap size={14} strokeWidth={1.8} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    name="grado_asignado"
                    type="text"
                    value={form.grado_asignado}
                    onChange={handleChange}
                    placeholder="Ej: 3ro B"
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
                  />
                </div>
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
                <UserPlus size={14} strokeWidth={2} />
              )}
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-indigo-600 font-semibold hover:text-indigo-700">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}

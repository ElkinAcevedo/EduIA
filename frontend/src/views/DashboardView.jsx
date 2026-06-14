import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'
import {
  Bell, Plus, BellRing, Star, History,
  Wand2, PenLine, Bot, Lightbulb,
  Users, FileText, TrendingUp,
  X, ChevronRight,
} from 'lucide-react'
import StatCard from '../components/StatCard'

// Gradientes para avatares (se asignan por índice)
const GRADIENTS = [
  'from-rose-400 to-pink-500',
  'from-sky-400 to-blue-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-indigo-400 to-violet-500',
]

// Íconos y colores para actividad según categoría
const CATEGORIA_META = {
  'Alta agitacion': { icon: BellRing,  iconBg: 'bg-red-100',     iconColor: 'text-red-500'     },
  'Logro positivo': { icon: Star,      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' },
  'Ajuste de entorno': { icon: Wand2,  iconBg: 'bg-indigo-100',  iconColor: 'text-indigo-500'  },
}
const FALLBACK_META = { icon: PenLine, iconBg: 'bg-slate-100', iconColor: 'text-slate-500' }

function statusDot(status) {
  return status === 'success' ? 'bg-emerald-400'
       : status === 'warning' ? 'bg-amber-400'
       : 'bg-red-400'
}

function AlertWarning({ alert, onDismiss, onNavigate }) {
  return (
    <div
      className="relative rounded-2xl p-5 flex gap-4 items-start"
      style={{ background: 'linear-gradient(135deg,#fffbeb,#fef3c7)', border: '1px solid #fde68a' }}
    >
      <button
        onClick={onDismiss}
        className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-lg text-amber-400 hover:text-amber-600 hover:bg-amber-100 transition-all"
      >
        <X size={12} strokeWidth={2} />
      </button>
      <span className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
        💡
      </span>
      <div className="flex-1 min-w-0 pr-4">
        <p className="font-semibold text-slate-700 text-sm mb-1">{alert.title}</p>
        <p className="text-sm text-slate-600 leading-relaxed">{alert.body}</p>
        <div className="mt-3 flex gap-2 flex-wrap">
          <button
            onClick={() => onNavigate(`/logbook?student=${alert.studentId}`)}
            className="text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            Ver Bitácora →
          </button>
          <button
            onClick={onDismiss}
            className="text-xs font-semibold text-slate-500 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            Descartar
          </button>
        </div>
      </div>
    </div>
  )
}

function AlertInfo({ alert }) {
  return (
    <div className="bg-white rounded-2xl p-4 flex gap-4 items-start border border-slate-100 border-l-4 border-l-indigo-400 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
      <span className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0">
        <Bot size={16} strokeWidth={1.8} className="text-indigo-500" />
      </span>
      <div>
        <p className="font-semibold text-slate-700 text-sm mb-1">{alert.title}</p>
        <p className="text-sm text-slate-500 leading-relaxed">{alert.body}</p>
      </div>
    </div>
  )
}

function ActiveStudentRow({ student, index, onClick }) {
  const gradient = GRADIENTS[index % GRADIENTS.length]
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-all duration-150 text-left group"
    >
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 shadow-sm`}>
        {student.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-700 truncate leading-tight">{student.name}</p>
        <p className="text-xs text-slate-400">Atención: {student.attention}%</p>
      </div>
      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot(student.status)}`} />
    </button>
  )
}

function ActivityItem({ item }) {
  const meta = CATEGORIA_META[item.categoria] || FALLBACK_META
  const Icon = meta.icon
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50">
      <span className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.iconBg}`}>
        <Icon size={13} strokeWidth={1.8} className={meta.iconColor} />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-600 truncate">{item.label}</p>
        <p className="text-[11px] text-slate-400">{item.student} · {item.time}</p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DashboardView() {
  const navigate = useNavigate()

  const [loading, setLoading]   = useState(true)
  const [stats, setStats]       = useState(null)
  const [activos, setActivos]   = useState([])
  const [alertas, setAlertas]   = useState([])
  const [actividad, setActividad] = useState([])

  useEffect(() => {
    api.get('dashboard/')
      .then(({ data }) => {
        setStats(data.stats)
        setActivos(data.activos)
        setAlertas(data.alertas)
        setActividad(data.actividad)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const dismissAlert = (id) => setAlertas((prev) => prev.filter((a) => a.id !== id))

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
  const todayFormatted = today.charAt(0).toUpperCase() + today.slice(1)

  const statCards = stats ? [
    {
      id: 'students',
      icon: Users,
      iconBg: 'bg-violet-50',
      iconColor: 'text-violet-600',
      value: stats.total_estudiantes,
      label: 'Estudiantes TDAH',
      badge: `${stats.estudiantes_hoy} entradas hoy`,
      trend: 'up',
      progress: Math.min(stats.total_estudiantes * 10, 100),
      progressColor: 'bg-violet-500',
    },
    {
      id: 'activos',
      icon: FileText,
      iconBg: 'bg-indigo-50',
      iconColor: 'text-indigo-600',
      value: activos.filter(a => a.status === 'success').length,
      label: 'Atención Normal',
      badge: 'Hoy',
      trend: 'up',
      progress: activos.length ? Math.round(activos.filter(a => a.status === 'success').length / activos.length * 100) : 0,
      progressColor: 'bg-indigo-500',
    },
    {
      id: 'alertas',
      icon: TrendingUp,
      iconBg: 'bg-amber-50',
      iconColor: 'text-amber-500',
      value: alertas.length,
      label: 'Alertas Activas',
      badge: alertas.length > 0 ? 'Requieren atención' : 'Todo en orden',
      trend: alertas.length > 0 ? 'up' : 'neutral',
      progress: activos.length ? Math.round(alertas.length / activos.length * 100) : 0,
      progressColor: 'bg-amber-400',
    },
  ] : []

  return (
    <div className="space-y-7">

      {/* HEADER */}
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
            ¡Hola, Profe! 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">
            Aquí tienes el resumen de tu aula hoy ·{' '}
            <span className="text-indigo-600 font-medium">{todayFormatted}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative">
            <button className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-500 transition-all shadow-sm">
              <Bell size={16} strokeWidth={1.8} />
            </button>
            {alertas.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold shadow-sm">
                {alertas.length}
              </span>
            )}
          </div>
          <button
            onClick={() => navigate('/logbook')}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
          >
            <Plus size={14} strokeWidth={2.5} />
            Nueva entrada
          </button>
        </div>
      </header>

      {/* STAT CARDS */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.id}
              icon={stat.icon}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              value={stat.value}
              label={stat.label}
              badge={stat.badge}
              trend={stat.trend}
              progress={stat.progress}
              progressColor={stat.progressColor}
              onClick={stat.id === 'students' ? () => navigate('/students') : undefined}
            />
          ))}
        </section>
      )}

      {/* ALERTAS + ESTUDIANTES ACTIVOS */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        <div className="lg:col-span-2 space-y-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <BellRing size={15} strokeWidth={2} className="text-amber-500" />
            Alertas 
          </h2>
          {loading ? (
            <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
          ) : alertas.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 text-center shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
              <p className="text-sm text-slate-400">Sin alertas activas · Todo en orden ✅</p>
            </div>
          ) : (
            alertas.map((alert) =>
              alert.type === 'warning' ? (
                <AlertWarning
                  key={alert.id}
                  alert={alert}
                  onDismiss={() => dismissAlert(alert.id)}
                  onNavigate={navigate}
                />
              ) : (
                <AlertInfo key={alert.id} alert={alert} />
              )
            )
          )}
        </div>

        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
            <Star size={14} strokeWidth={2} className="text-indigo-500" />
            Estudiantes activos
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 p-3 shadow-[0_2px_16px_rgba(15,23,42,0.06)] space-y-1">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-10 rounded-xl bg-slate-100 animate-pulse" />)
            ) : activos.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Sin estudiantes registrados</p>
            ) : (
              activos.map((student, i) => (
                <ActiveStudentRow
                  key={student.id}
                  student={student}
                  index={i}
                  onClick={() => navigate(`/logbook?student=${student.id}`)}
                />
              ))
            )}
            <div className="pt-2 mt-1 border-t border-slate-100">
              <button
                onClick={() => navigate('/students')}
                className="w-full flex items-center justify-center gap-1 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
              >
                Ver todos los estudiantes
                <ChevronRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVIDAD RECIENTE */}
      <section>
        <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
          <History size={14} strokeWidth={1.8} className="text-slate-400" />
          Actividad reciente
        </h2>
        <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[1,2,3,4].map(i => <div key={i} className="h-14 rounded-xl bg-slate-100 animate-pulse" />)}
            </div>
          ) : actividad.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Sin actividad reciente</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {actividad.map((item) => (
                <ActivityItem key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </section>

    </div>
  )
}

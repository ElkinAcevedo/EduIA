import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import {
  Plus, Clock, Brain, ChevronDown, ChevronRight, AlertCircle,
  Star, StickyNote, CheckCircle2, X, CalendarDays, BarChart3,
  Lightbulb, PenLine, Users, 
} from 'lucide-react'

// type: 'alert' | 'positive' | 'note'
// Mapeo de categoria del backend al type visual del frontend
const categoryToType = {
  'Alta agitacion':   'alert',
  'Logro positivo':   'positive',
  'Ajuste de entorno': 'note',
}


const mapEntry = (e) => ({
  id:        e.id,
  studentId: e.estudiante,
  type:      categoryToType[e.categoria] ?? 'note',
  title:     e.titulo,
  body:      e.descripcion,
  badge:     e.categoria,
  date:      new Date(e.creado_en).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' }),
  time:      new Date(e.creado_en).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
})
// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function entryMeta(type) {
  switch (type) {
    case 'alert':
      return {
        Icon: AlertCircle,
        dotBg: 'bg-amber-400',
        dotRing: 'ring-amber-100',
        badgeBg: 'bg-amber-50 text-amber-600 border-amber-100',
      }
    case 'positive':
      return {
        Icon: Star,
        dotBg: 'bg-emerald-400',
        dotRing: 'ring-emerald-100',
        badgeBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      }
    default:
      return {
        Icon: StickyNote,
        dotBg: 'bg-slate-400',
        dotRing: 'ring-slate-100',
        badgeBg: 'bg-slate-100 text-slate-600 border-slate-200',
      }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

/** Entrada de timeline */
function TimelineEntry({ entry, isLast, onEdit, onDelete }) {
  const { Icon, dotBg, dotRing, badgeBg } = entryMeta(entry.type)

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <span className={`w-8 h-8 rounded-xl ${dotBg} ring-4 ${dotRing} flex items-center justify-center flex-shrink-0 shadow-sm`}>
          <Icon size={13} strokeWidth={2} className="text-white" />
        </span>
        {!isLast && <div className="w-px flex-1 bg-slate-100 mt-2" />}
      </div>

      <div className={`min-w-0 flex-1 ${!isLast ? 'pb-5' : ''}`}>
        <p className="text-[11px] text-slate-400 mb-1">{entry.date} · {entry.time}</p>
        <p className="text-sm font-semibold text-slate-700 leading-snug mb-1">{entry.title}</p>
        <p className="text-sm text-slate-500 leading-relaxed mb-2">{entry.body}</p>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border ${badgeBg}`}>
            {entry.badge}
          </span>
          <button onClick={() => onEdit(entry)}
            className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 transition-all">
            Editar
          </button>
          <button onClick={() => onDelete(entry.id)}
            className="px-2 py-0.5 rounded-lg text-[11px] font-semibold text-red-500 bg-red-50 border border-red-100 hover:bg-red-100 transition-all">
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
/** Barra del gráfico de atención por día */
function AttentionBar({ day, value, color, textColor, warning }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-slate-500 w-8 text-right flex-shrink-0">{day}</span>
      <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${color} transition-all duration-700 ease-out`}
          style={{ width: `${value}%` }}
        />
      </div>
      <span className={`text-xs font-bold w-14 flex-shrink-0 ${textColor}`}>
        {value}%{warning ? ' ⚠️' : ''}
      </span>
    </div>
  )
}

/** Modal  entrada */
function NewEntryModal({ students, defaultStudentId, onClose, onEntrySaved }) {
  const [type,    setType]    = useState('note')
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState(null)
  const [form,    setForm]    = useState({
    estudiante: defaultStudentId,
    titulo:     '',
    descripcion:'',
    categoria:  'Logro positivo',
    puntaje_atencion: '',
  })

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const categoryToType = {
    'Alta agitacion':    'alert',
    'Logro positivo':    'positive',
    'Ajuste de entorno': 'note',
  }

  const handleSave = () => {
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError('Título y descripción son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    api.post('/logbook/', {
      estudiante:       form.estudiante,
      titulo:           form.titulo.trim(),
      descripcion:      form.descripcion.trim(),
      categoria:        form.categoria,
      puntaje_atencion: form.puntaje_atencion !== '' ? parseInt(form.puntaje_atencion) : 0,
    })
      .then((res) => { onEntrySaved(res.data); onClose() })
      .catch(() => setError('No se pudo guardar. Intenta de nuevo.'))
      .finally(() => setSaving(false))
  }

  const TYPES = [
    { value: 'Logro positivo',    label: '⭐ Logro positivo',     ring: 'ring-emerald-300 bg-emerald-50 text-emerald-700' },
    { value: 'Alta agitacion',    label: '⚠️ Alerta / conducta', ring: 'ring-amber-300 bg-amber-50 text-amber-700'       },
    { value: 'Ajuste de entorno', label: '📝 Nota general',       ring: 'ring-slate-300 bg-slate-100 text-slate-700'      },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Nueva entrada
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Registro de observación</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Estudiante</label>
            <div className="relative">
              <select
                name="estudiante"
                value={form.estudiante}
                onChange={handleChange}
                className="w-full appearance-none text-sm border border-slate-200 rounded-xl px-3 py-2.5 pr-8 text-slate-700 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Tipo de observación</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((prev) => ({ ...prev, categoria: t.value }))}
                  className={[
                    'px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                    form.categoria === t.value
                      ? `ring-2 ${t.ring} border-transparent`
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Título <span className="text-red-400">*</span>
            </label>
            <input
              name="titulo"
              type="text"
              value={form.titulo}
              onChange={handleChange}
              placeholder="Ej: Dificultad en lectura matutina"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Observación detallada <span className="text-red-400">*</span>
            </label>
            <textarea
              name="descripcion"
              rows={4}
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Describe lo que ocurrió, el contexto, la reacción del estudiante..."
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Puntaje de atención
              <span className="text-slate-400 font-normal ml-1">(0 – 100%)</span>
            </label>
            <input
              name="puntaje_atencion"
              type="number"
              value={form.puntaje_atencion}
              onChange={handleChange}
              placeholder="Ej: 75"
              min={0} max={100}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-60">
            <CheckCircle2 size={14} strokeWidth={2} />
            {saving ? 'Guardando...' : 'Guardar entrada'}
          </button>
        </div>
      </div>
    </div>
  )
}

function EditEntryModal({ entry, students, onClose, onEntryUpdated }) {
  const [form,   setForm]   = useState({
    estudiante:       entry.studentId,
    titulo:           entry.title,
    descripcion:      entry.body,
    categoria:        entry.badge,
    puntaje_atencion: String(entry.puntaje_atencion ?? 0),
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const TYPES = [
    { value: 'Logro positivo',    label: '⭐ Logro positivo',     ring: 'ring-emerald-300 bg-emerald-50 text-emerald-700' },
    { value: 'Alta agitacion',    label: '⚠️ Alerta / conducta', ring: 'ring-amber-300 bg-amber-50 text-amber-700'       },
    { value: 'Ajuste de entorno', label: '📝 Nota general',       ring: 'ring-slate-300 bg-slate-100 text-slate-700'      },
  ]

  const handleSave = () => {
    if (!form.titulo.trim() || !form.descripcion.trim()) {
      setError('Título y descripción son obligatorios.')
      return
    }
    setSaving(true)
    setError(null)
    api.patch(`/logbook/${entry.id}/`, {
      titulo:           form.titulo.trim(),
      descripcion:      form.descripcion.trim(),
      categoria:        form.categoria,
      puntaje_atencion: form.puntaje_atencion !== '' ? parseInt(form.puntaje_atencion) : 0,
    })
      .then((res) => { onEntryUpdated(res.data); onClose() })
      .catch(() => setError('No se pudo actualizar. Intenta de nuevo.'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-lg p-6 z-10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Editar entrada
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{entry.title}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all">
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-2">Tipo de observación</label>
            <div className="flex gap-2 flex-wrap">
              {TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setForm((prev) => ({ ...prev, categoria: t.value }))}
                  className={[
                    'px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all',
                    form.categoria === t.value
                      ? `ring-2 ${t.ring} border-transparent`
                      : 'border-slate-200 text-slate-500 bg-white hover:bg-slate-50',
                  ].join(' ')}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Título <span className="text-red-400">*</span></label>
            <input name="titulo" type="text" value={form.titulo} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Observación detallada <span className="text-red-400">*</span></label>
            <textarea name="descripcion" rows={4} value={form.descripcion} onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Puntaje de atención <span className="text-slate-400 font-normal ml-1">(0 – 100%)</span>
            </label>
            <input name="puntaje_atencion" type="number" value={form.puntaje_atencion} onChange={handleChange}
              min={0} max={100}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-60">
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}



// ─────────────────────────────────────────────────────────────────────────────
// LogbookView
// ─────────────────────────────────────────────────────────────────────────────
export default function LogbookView() {
  const [searchParams]               = useSearchParams()
  const [selectedId, setSelectedId]  = useState(Number(searchParams.get('student')) || null)
  const [showModal,  setShowModal]   = useState(false)
  const [showAll,    setShowAll]     = useState(false)
  const [student,    setStudent]     = useState(null)
  const [entries,    setEntries]     = useState([])
  const [loading,    setLoading]     = useState(true)
  const [editingEntry, setEditingEntry] = useState(null)
  const [allStudents,  setAllStudents]  = useState([])

  const handleEntrySaved = (newRaw) => {
    setEntries((prev) => [mapEntry(newRaw), ...prev])
  }

  const handleEntryUpdated = (updatedRaw) => {
    setEntries((prev) => prev.map((e) => e.id === updatedRaw.id ? mapEntry(updatedRaw) : e))
  }

  const handleEntryDeleted = (id) => {
    api.delete(`/logbook/${id}/`)
      .then(() => setEntries((prev) => prev.filter((e) => e.id !== id)))
      .catch(console.error)
  }

  // Carga todos los estudiantes y si no hay ID seleccionado usa el primero
  useEffect(() => {
    api.get('/students/')
      .then((res) => {
        const mapped = res.data.map(s => ({ id: s.id, name: s.nombre }))
        setAllStudents(mapped)
        if (!selectedId && mapped.length > 0) {
          setSelectedId(mapped[0].id)
        }
      })
      .catch(console.error)
  }, [])

  // Carga estudiante activo
  useEffect(() => {
    if (!selectedId) return
    api.get(`/students/${selectedId}/`)
      .then((res) => {
        const s = res.data
        setStudent({
          id:             s.id,
          name:           s.nombre,
          initials:       s.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
          avatarGradient: 'from-indigo-400 to-violet-500',
        })
      })
      .catch(console.error)
  }, [selectedId])

  // Carga entradas de bitácora
  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    api.get(`/logbook/?student=${selectedId}`)
      .then((res) => setEntries(res.data.map(mapEntry)))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [selectedId])

  const visibleEntries = showAll ? entries : entries.slice(0, 3)

  if (loading && !student) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  )

  if (!student && allStudents.length === 0) return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
        <Users size={24} strokeWidth={1.5} className="text-slate-400" />
      </div>
      <p className="text-sm font-semibold text-slate-600 mb-1">Sin estudiantes registrados</p>
      <p className="text-xs text-slate-400">Agrega un estudiante primero desde la sección Mis Estudiantes.</p>
    </div>
  )



  return (
    <>
      <div className="space-y-6">

        {/* ── HEADER ─────────────────────────────────────────────────────── */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1
              className="text-2xl font-bold text-slate-800 tracking-tight"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Bitácora y Análisis IA
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              Registro de observaciones y patrones de comportamiento
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Selector de estudiante */}
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => { setSelectedId(Number(e.target.value)); setShowAll(false) }}
	  className="appearance-none text-sm border border-slate-200 rounded-xl px-4 py-2.5 pr-9 text-slate-700 bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none shadow-sm transition-all"
	  >
	  {allStudents.map((s) => (
  <option key={s.id} value={s.id}>{s.name}</option>
	  ))}       
	  </select>
	  <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Nueva entrada */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
            >
              <Plus size={14} strokeWidth={2.5} />
              Nueva entrada
            </button>
          </div>
        </header>

        {/* ── CUERPO: TIMELINE + ANÁLISIS IA ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

          {/* Timeline (2/5) */}
          <div className="lg:col-span-2">
            <h2
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <Clock size={14} strokeWidth={1.8} className="text-slate-400" />
              Observaciones recientes
            </h2>

            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
{loading ? (
  <div className="flex items-center justify-center py-10">
    <div className="w-6 h-6 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin" />
  </div>
) : entries.length === 0 ? (
  <div className="flex flex-col items-center py-10">
    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
      <PenLine size={20} strokeWidth={1.5} className="text-slate-400" />
    </div>
    <p className="text-sm text-slate-500 font-medium mb-1">Sin entradas registradas</p>
    <p className="text-xs text-slate-400 text-center">Agrega la primera observación para este estudiante.</p>
  </div>
) : (
  <>
    <div>
      {visibleEntries.map((entry, idx) => (
        <TimelineEntry
  key={entry.id}
  entry={entry}
  isLast={idx === visibleEntries.length - 1 && (showAll || entries.length <= 3)}
  onEdit={setEditingEntry}
  onDelete={handleEntryDeleted}
/>     
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-slate-100">
      <button
        onClick={() => setShowAll((v) => !v)}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl transition-all"
      >
        {showAll ? 'Mostrar menos' : `Ver todas las entradas (${entries.length}) →`}
        <ChevronRight
          size={12}
          strokeWidth={2.5}
          className={`transition-transform ${showAll ? 'rotate-90' : ''}`}
        />
      </button>
    </div>
  </>
)} 
            </div>
          </div>  

	{/* Análisis IA (3/5) */}
          <div className="lg:col-span-3">
            <h2
              className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              <Brain size={14} strokeWidth={1.8} className="text-indigo-500" />
              Análisis de patrones de IA
            </h2>

            {/* Card análisis */}
            <div
              className="rounded-2xl p-5 mb-4 shadow-[0_2px_16px_rgba(99,102,241,0.1)]"
              style={{ background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)', border: '1.5px solid #c7d2fe' }}
            >
              {/* Cabecera del análisis */}
              <div className="flex items-start gap-3 mb-5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-lg">🧠</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-slate-800"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    Análisis de Patrones · {student.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Basado en {entries.length} entradas · Últimas 3 semanas
	  </p>
                </div>
                <span className="flex-shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                  87% confianza
                </span>
              </div>

              {/* Gráfico por días */}
              <div className="mb-5">
                <div className="flex items-center gap-2 mb-3">
                  <BarChart3 size={13} strokeWidth={2} className="text-indigo-400" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nivel de atención por días (promedio)
                  </p>
	</div>
	<div className="space-y-2.5">
	<p className="text-xs text-slate-400 text-center py-4">
	El análisis de patrones estará disponible cuando se integre la IA.
	</p>                </div>
              </div>

              {/* Patrón detectado */}
              <div className="p-4 rounded-xl bg-white border border-slate-100 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDays size={13} strokeWidth={2} className="text-indigo-500" />
                  <p className="text-xs font-semibold text-slate-700">Patrón detectado</p>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-3">
                  La <strong className="text-slate-800">inatención aumenta los días martes y jueves</strong>.
                  Esto coincide con las sesiones de mayor carga teórica. Los viernes presenta el mejor
                  desempeño, posiblemente por el formato de actividades más dinámicas.
                </p>

                {/* Sugerencia IA */}
                <div
                  className="p-3 rounded-xl flex items-start gap-2.5"
                  style={{ background: '#eef2ff', border: '1px solid #c7d2fe' }}
                >
                  <Lightbulb size={14} strokeWidth={2} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    <strong>Sugerencia IA:</strong> Implementar{' '}
                    <em>pausas activas cada 20 min</em> los martes y jueves. Rotar el asiento de{' '}
                    {student.name.split(' ')[0]} cerca del pizarrón esos días para aumentar el foco.
                  </p>
                </div>
              </div>
            </div>

            {/* Mini stats de la bitácora */}
            <div className="grid grid-cols-3 gap-3">
              {[
                {
                  icon: Star,
                  iconBg: 'bg-emerald-50',
                  iconColor: 'text-emerald-500',
                  value: entries.filter((e) => e.type === 'positive').length,
                  label: 'Logros registrados',
                },
                {
                  icon: AlertCircle,
                  iconBg: 'bg-amber-50',
                  iconColor: 'text-amber-500',
                  value: entries.filter((e) => e.type === 'alert').length,
                  label: 'Alertas registradas',
                },
                {
                  icon: StickyNote,
                  iconBg: 'bg-slate-100',
                  iconColor: 'text-slate-500',
                  value: entries.filter((e) => e.type === 'note').length,
                  label: 'Notas generales',
                },
              ].map(({ icon: Icon, iconBg, iconColor, value, label }) => (
                <div
                  key={label}
                  className="bg-white rounded-2xl border border-slate-100 p-4 shadow-[0_2px_12px_rgba(15,23,42,0.05)] flex flex-col items-center text-center"
                >
                  <span className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center mb-2`}>
                    <Icon size={15} strokeWidth={1.8} className={iconColor} />
                  </span>
                  <p
                    className="text-2xl font-bold text-slate-800 leading-none"
                    style={{ fontFamily: "'Poppins', sans-serif" }}
                  >
                    {value}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-1 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

	{/* ── MODAL ──────────────────────────────────────────────────────────── */}
{showModal && (
  <NewEntryModal
    students={allStudents}
    defaultStudentId={selectedId}
    onClose={() => setShowModal(false)}
    onEntrySaved={handleEntrySaved}
  />
)}

{editingEntry && (
  <EditEntryModal
    entry={editingEntry}
    students={allStudents}
    onClose={() => setEditingEntry(null)}
    onEntryUpdated={handleEntryUpdated}
  />
)}

</>
  )
}

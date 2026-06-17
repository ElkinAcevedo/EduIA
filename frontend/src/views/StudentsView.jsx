import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, Users, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react'
import StudentCard from '../components/StudentCard'

// Adapta la respuesta del backend al shape que espera el frontend
const mapStudent = (s) => ({
  id:            s.id,
  name:          s.nombre,
  age:           s.edad,
  grade:         s.grado,
  type:          `TDAH ${s.tipo_tdah}`,          // "Combinado" → "TDAH Combinado"
  strengths:     s.fortalezas ?? [],
  attention:     s.atencion_promedio ?? 0,
  participation: s.puntaje_participacion ?? 0,
  alerts:        (s.atencion_promedio ?? 0) < 60 ? 1 : 0,  // alerta si atención < 60%
  // Generados en frontend porque el backend no los devuelve aún
  initials:      s.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  avatarGradient: 'from-indigo-400 to-violet-500',
})

import api from '../api'

// Filtros de tipo TDAH disponibles
const FILTERS = [
  { value: 'todos',       label: 'Todos'             },
  { value: 'combinado',   label: 'TDAH Combinado'    },
  { value: 'inatento',    label: 'TDAH Inatento'     },
  { value: 'hiperactivo', label: 'TDAH Hiperactivo'  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: barra de summary de alertas globales
// ─────────────────────────────────────────────────────────────────────────────
function AlertSummaryBar({ students }) {
  const withAlerts = students.filter((s) => s.alerts > 0)
  const allOk      = withAlerts.length === 0

  if (allOk) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100">
        <CheckCircle size={16} strokeWidth={2} className="text-emerald-500 flex-shrink-0" />
        <p className="text-sm text-emerald-700 font-medium">
          Todos los estudiantes sin alertas activas hoy ✅
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-amber-50 border border-amber-100">
      <AlertCircle size={16} strokeWidth={2} className="text-amber-500 flex-shrink-0" />
      <p className="text-sm text-amber-700 font-medium">
        <span className="font-bold">{withAlerts.length}</span>{' '}
        {withAlerts.length === 1 ? 'estudiante requiere' : 'estudiantes requieren'} atención:{' '}
        <span className="font-semibold">
          {withAlerts.map((s) => s.name.split(' ')[0]).join(', ')}
        </span>
      </p>
    </div>
  )
}

//notificacion de confirmacion 
function ConfirmDeleteModal({ student, onConfirm, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm p-6 z-10">
        
        {/* Icono */}
        <div className="flex items-center justify-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center">
            <Trash2 size={24} strokeWidth={1.8} className="text-red-500" />
          </div>
        </div>

        {/* Texto */}
        <div className="text-center mb-6">
          <h3
            className="text-lg font-bold text-slate-800 mb-2"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            Eliminar estudiante
          </h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            ¿Estás seguro de que deseas eliminar a{' '}
            <span className="font-semibold text-slate-700">{student.name}</span>?
            Esta acción no se puede deshacer.
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-red-500 hover:bg-red-600 shadow-sm shadow-red-200 transition-all"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// Sub-componente: modal "Agregar estudiante" (placeholder UI)
// ─────────────────────────────────────────────────────────────────────────────
function AddStudentModal({ onClose, onStudentAdded }) {
 const [form, setForm] = useState({
	  nombre:                '',
	  edad:                  '',
	  grado:                 '',
	  tipo_tdah:             'Combinado',
	  atencion_promedio:     '',     
	  puntaje_participacion: '',      
	  fortalezas:            '',
	})
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = () => {
    // Validación básica
    if (!form.nombre.trim() || !form.edad || !form.grado.trim()) {
      setError('Nombre, edad y grado son obligatorios.')
      return
    }

    setSaving(true)
    setError(null)
    const payload = {
	nombre:                form.nombre.trim(),
	edad:                  parseInt(form.edad),
	grado:                 form.grado.trim(),
	tipo_tdah:             form.tipo_tdah,
	atencion_promedio:     form.atencion_promedio     !== '' ? parseInt(form.atencion_promedio)     : 0,
	puntaje_participacion: form.puntaje_participacion !== '' ? parseInt(form.puntaje_participacion) : 0,
	fortalezas:            form.fortalezas
	? form.fortalezas.split(',').map((f) => f.trim()).filter(Boolean)
	: [],
	profesor: 1,
	}

    api.post('/students/', payload)
      .then((res) => {
        onStudentAdded(res.data)   // ← notifica al padre
        onClose()
      })
      .catch(() => setError('No se pudo guardar el estudiante. Intenta de nuevo.'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-lg font-bold text-slate-800"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Agregar estudiante
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Nuevo perfil TDAH</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: María López"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Edad <span className="text-red-400">*</span>
              </label>
              <input
                name="edad"
                type="number"
                value={form.edad}
                onChange={handleChange}
                placeholder="Ej: 8"
                min={4} max={18}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Grado <span className="text-red-400">*</span>
              </label>
              <input
                name="grado"
                type="text"
                value={form.grado}
                onChange={handleChange}
                placeholder="Ej: 3ro B"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Subtipo TDAH
            </label>
            <select
              name="tipo_tdah"
              value={form.tipo_tdah}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            >
              <option value="Combinado">TDAH Combinado</option>
              <option value="Inatento">TDAH Inatento</option>
              <option value="Hiperactivo">TDAH Hiperactivo</option>
            </select>
          </div>

	<div className="flex gap-3">
	  <div className="flex-1">
	    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
	      Atención promedio
	      <span className="text-slate-400 font-normal ml-1">(0 – 100%)</span>
	    </label>
	    <input
	      name="atencion_promedio"
	      type="number"
	      value={form.atencion_promedio}
	      onChange={handleChange}
	      placeholder="Ej: 75"
	      min={0} max={100}
	      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
	    />
	  </div>
	  <div className="flex-1">
	    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
	      Participación
	      <span className="text-slate-400 font-normal ml-1">(0 – 10 pts)</span>
	    </label>
	    <input
	      name="puntaje_participacion"
	      type="number"
	      value={form.puntaje_participacion}
	      onChange={handleChange}
	      placeholder="Ej: 8"
	      min={0} max={10}
	      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
	    />
	  </div>
	</div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Fortalezas
              <span className="text-slate-400 font-normal ml-1">(separadas por coma)</span>
            </label>
            <input
              name="fortalezas"
              type="text"
              value={form.fortalezas}
              onChange={handleChange}
              placeholder="Ej: Visual, Creativo, Musical"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

//editar estudiantes 

function EditStudentModal({ student, onClose, onStudentUpdated }) {
  const [form, setForm] = useState({
    nombre:                student.name,
    edad:                  String(student.age),
    grado:                 student.grade,
    tipo_tdah:             student.type.replace('TDAH ', ''),
    atencion_promedio:     String(student.attention),
    puntaje_participacion: String(student.participation),
    fortalezas:            student.strengths.join(', '),
  })
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState(null)

  const handleChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSave = () => {
    if (!form.nombre.trim() || !form.edad || !form.grado.trim()) {
      setError('Nombre, edad y grado son obligatorios.')
      return
    }

    setSaving(true)
    setError(null)

    const payload = {
      nombre:                form.nombre.trim(),
      edad:                  parseInt(form.edad),
      grado:                 form.grado.trim(),
      tipo_tdah:             form.tipo_tdah,
      atencion_promedio:     form.atencion_promedio     !== '' ? parseInt(form.atencion_promedio)     : 0,
      puntaje_participacion: form.puntaje_participacion !== '' ? parseInt(form.puntaje_participacion) : 0,
      fortalezas:            form.fortalezas
        ? form.fortalezas.split(',').map((f) => f.trim()).filter(Boolean)
        : [],
      profesor: 1,
    }

    api.patch(`/students/${student.id}/`, payload)
      .then((res) => {
        onStudentUpdated(res.data)
        onClose()
      })
      .catch(() => setError('No se pudo actualizar el estudiante. Intenta de nuevo.'))
      .finally(() => setSaving(false))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-lg font-bold text-slate-800"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Editar estudiante
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">{student.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 mb-4 rounded-xl bg-red-50 border border-red-100">
            <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
            <p className="text-xs text-red-600 font-medium">{error}</p>
          </div>
        )}

        {/* Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Nombre completo <span className="text-red-400">*</span>
            </label>
            <input
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Edad <span className="text-red-400">*</span>
              </label>
              <input
                name="edad"
                type="number"
                value={form.edad}
                onChange={handleChange}
                min={4} max={18}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Grado <span className="text-red-400">*</span>
              </label>
              <input
                name="grado"
                type="text"
                value={form.grado}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Subtipo TDAH
            </label>
            <select
              name="tipo_tdah"
              value={form.tipo_tdah}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            >
              <option value="Combinado">TDAH Combinado</option>
              <option value="Inatento">TDAH Inatento</option>
              <option value="Hiperactivo">TDAH Hiperactivo</option>
            </select>
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Atención promedio
                <span className="text-slate-400 font-normal ml-1">(0 – 100%)</span>
              </label>
              <input
                name="atencion_promedio"
                type="number"
                value={form.atencion_promedio}
                onChange={handleChange}
                min={0} max={100}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                Participación
                <span className="text-slate-400 font-normal ml-1">(0 – 10 pts)</span>
              </label>
              <input
                name="puntaje_participacion"
                type="number"
                value={form.puntaje_participacion}
                onChange={handleChange}
                min={0} max={10}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Fortalezas
              <span className="text-slate-400 font-normal ml-1">(separadas por coma)</span>
            </label>
            <input
              name="fortalezas"
              type="text"
              value={form.fortalezas}
              onChange={handleChange}
              placeholder="Ej: Visual, Creativo, Musical"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-all disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}


// ─────────────────────────────────────────────────────────────────────────────
// StudentsView
// ─────────────────────────────────────────────────────────────────────────────
export default function StudentsView() {
  const navigate = useNavigate()

  const [students,     setStudents]     = useState([])       // ← antes era MOCK_STUDENTS
  const [loading,      setLoading]      = useState(true)     // ← estado de carga
  const [error,        setError]        = useState(null)     // ← estado de error
  const [search,       setSearch]       = useState('')
  const [activeFilter, setActiveFilter] = useState('todos')
  const [showModal,    setShowModal]    = useState(false)
  const handleStudentAdded = (newStudentRaw) => {
  setStudents((prev) => [...prev, mapStudent(newStudentRaw)])
}
 const [editingStudent, setEditingStudent] = useState(null)   

 const handleStudentUpdated = (updatedRaw) => {
  setStudents((prev) =>
    prev.map((s) => s.id === updatedRaw.id ? mapStudent(updatedRaw) : s)
  )
 }
const [deletingStudent, setDeletingStudent] = useState(null)
const handleStudentDeleted = () => {
  api.delete(`/students/${deletingStudent.id}/`)
    .then(() => {
      setStudents((prev) => prev.filter((s) => s.id !== deletingStudent.id))
      setDeletingStudent(null)
    })
    .catch(() => setDeletingStudent(null))
}
  // ── Carga desde la API ──────────────────────────────────────────────────────
useEffect(() => {
  api.get('/students/')
    .then((res) => {
      console.log('DATA:', res.data)
      setStudents(res.data.map(mapStudent))   // ← mapeo aquí
    })
    .catch((err) => {
      console.log('ERROR:', err.message, err.response?.status)
      setError('No se pudieron cargar los estudiantes.')
    })
    .finally(() => setLoading(false))
}, [])
  // ── Filtrado reactivo: búsqueda + tipo TDAH ─────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return students.filter((s) => {
      const matchSearch = !q || s.name.toLowerCase().includes(q) || s.type.toLowerCase().includes(q)
      const matchFilter =
        activeFilter === 'todos' ||
        s.type.toLowerCase().includes(activeFilter)
      return matchSearch && matchFilter
    })
  }, [search, activeFilter, students])  // ← students en deps en lugar de MOCK_STUDENTS

  // ── Estados de carga / error (no tocan el layout principal) ────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
        <AlertCircle size={28} strokeWidth={1.5} className="text-red-400 mb-3" />
        <p className="text-sm font-semibold text-slate-600">{error}</p>
        <button
          onClick={() => { setError(null); setLoading(true); api.get('/students/').then((r) => setStudents(r.data)).catch(() => setError('No se pudieron cargar los estudiantes.')).finally(() => setLoading(false)) }}
          className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
        >
          Reintentar
        </button>
      </div>
    )
  }

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
              Mis Estudiantes
            </h1>
            <p className="text-slate-500 mt-1 text-sm">
              <span className="font-semibold text-indigo-600">{students.length}</span>{' '}
              estudiantes con TDAH · 3ro B
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Búsqueda */}
            <div className="relative">
              <Search
                size={14}
                strokeWidth={2}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar estudiante..."
                className="pl-9 pr-4 py-2.5 w-52 rounded-xl border border-slate-200 bg-white text-sm text-slate-600 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all outline-none shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}
            </div>

            {/* Agregar */}
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-all shadow-sm shadow-indigo-200"
            >
              <UserPlus size={14} strokeWidth={2.2} />
              Agregar
            </button>
          </div>
        </header>

        {/* ── ALERT SUMMARY ──────────────────────────────────────────────── */}

        {/* ── FILTROS POR TIPO ───────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={[
                'px-4 py-2 rounded-xl text-xs font-semibold border transition-all duration-150',
                activeFilter === f.value
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-200'
                  : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50',
              ].join(' ')}
            >
              {f.label}
            </button>
          ))}

          {/* Contador de resultados */}
          <span className="ml-auto self-center text-xs text-slate-400 font-medium">
            {filtered.length}{' '}
            {filtered.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>

	  {/* ── GRID DE CARDS ──────────────────────────────────────────────── */}
	  {filtered.length > 0 ? (
	   <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
	     {filtered.map((student) => (
		     <StudentCard
		     key={student.id}
		     student={student}
		     onView={() => navigate(`/logbook?student=${student.id}`)}
		     onAssistant={() => navigate(`/assistant?student=${student.id}`)}
		     onEdit={() => setEditingStudent(student)}
		     onDelete={() => setDeletingStudent(student)}
	/>          
		  ))}
          </div>
        ) : (
          /* Estado vacío */
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)]">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Users size={24} strokeWidth={1.5} className="text-slate-400" />
            </div>
            <p className="text-sm font-semibold text-slate-600 mb-1">
              {search ? 'Sin resultados para esa búsqueda' : 'Sin estudiantes registrados'}
            </p>
            <p className="text-xs text-slate-400">
              {search
                ? `No encontramos coincidencias para "${search}"`
                : 'Agrega el primer perfil TDAH para comenzar'}
            </p>
            {search && (
              <button
                onClick={() => { setSearch(''); setActiveFilter('todos') }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-all"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

      </div>

      {/* ── MODAL AGREGAR ──────────────────────────────────────────────────── */}
      {showModal && (
        <AddStudentModal
          onClose={() => setShowModal(false)}
          onStudentAdded={handleStudentAdded}
        />
      )}

      {/* ── MODAL EDITAR ───────────────────────────────────────────────────── */}
      {editingStudent && (
        <EditStudentModal
          student={editingStudent}
          onClose={() => setEditingStudent(null)}
          onStudentUpdated={handleStudentUpdated}
        />
      )}

      {deletingStudent && (
  <ConfirmDeleteModal
    student={deletingStudent}
    onConfirm={handleStudentDeleted}
    onClose={() => setDeletingStudent(null)}
  />
)}

    </>
  )
}

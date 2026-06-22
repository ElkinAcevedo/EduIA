import { useState, useEffect } from 'react'
import api from '../api'
import {
  Sliders,
  FileCheck,
  Copy,
  Printer,
  Download,
  Key,
  ListOrdered,
  Star,
  Wand2,
  Brain,
  Lightbulb,
  ChevronDown,
  Check,
  AlertCircle,
} from 'lucide-react'

// ── Static data ───────────────────────────────────────────────────────────────
const MATERIAL_TYPES = [
  '📚 Lectura corta',
  '✏️ Actividad práctica',
  '📝 Mini evaluación',
  '🗺️ Mapa conceptual',
  '🎮 Juego de repaso',
]

const DIFFICULTIES = [
  { id: 'Basico',     label: 'Básico'      },
  { id: 'Intermedio', label: 'Intermedio'  },
  { id: 'Avanzado',   label: 'Avanzado'    },
]

const EXTRA_OPTIONS = [
  { id: 'emojis',   label: 'Incluir emojis de apoyo visual'   },
  { id: 'steps',    label: 'Segmentar en pasos numerados'      },
  { id: 'selfeval', label: 'Añadir sección de autoevaluación' },
]

// Colores rotativos para los pasos (igual que el mockup original)
const STEP_STYLES = [
  { bg: 'bg-indigo-50',  border: 'border-indigo-200',  circle: 'bg-indigo-600',  circleShadow: 'shadow-indigo-300',  text: 'text-indigo-800',  accent: 'text-indigo-600'  },
  { bg: 'bg-emerald-50', border: 'border-emerald-200', circle: 'bg-emerald-500', circleShadow: 'shadow-emerald-200', text: 'text-emerald-800', accent: 'text-emerald-600' },
  { bg: '',              border: '',                   circle: '',               circleShadow: '',                  text: 'text-violet-800',  accent: 'text-violet-600',
    customBg: '#fdf4ff', customBorder: '#e9d5ff', customCircle: '#7c3aed' },
  { bg: 'bg-sky-50',     border: 'border-sky-200',     circle: 'bg-sky-500',     circleShadow: 'shadow-sky-200',     text: 'text-sky-800',     accent: 'text-sky-600'     },
]

function StyledSelect({ value, onChange, options, getLabel }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-4 py-2.5 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
      >
        {options.map((opt) => (
          <option key={opt.id ?? opt} value={opt.id ?? opt}>
            {getLabel ? getLabel(opt) : opt}
          </option>
        ))}
      </select>
      <ChevronDown
        size={13}
        strokeWidth={2}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
      />
    </div>
  )
}

function StepBlock({ paso, index }) {
  const style = STEP_STYLES[index % STEP_STYLES.length]
  const isCustom = !!style.customBg

  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-2xl border ${!isCustom ? `${style.bg} ${style.border}` : ''}`}
      style={isCustom ? { background: style.customBg, borderColor: style.customBorder } : undefined}
    >
      <div
        className={`w-7 h-7 rounded-full text-white flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${!isCustom ? `${style.circle} shadow-sm ${style.circleShadow}` : ''}`}
        style={isCustom ? { background: style.customCircle, boxShadow: '0 2px 8px rgba(124,58,237,0.3)' } : undefined}
      >
        {index + 1}
      </div>
      <div className="text-sm flex-1">
        <strong className={style.text}>
          {paso.emoji} {paso.titulo}
        </strong>
        <br />
        <span className="text-slate-600">{paso.contenido}</span>

        {paso.ejercicio_grid && paso.ejercicio_grid.length > 0 && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {paso.ejercicio_grid.map((item, i) => (
              <div key={i} className="p-2.5 rounded-xl bg-white border border-violet-200 text-center">
                <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
                <p className="font-mono text-lg font-bold text-violet-500">{item.valor}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdapterView() {
  const [estudiantes,   setEstudiantes]   = useState([])
  const [topic,         setTopic]         = useState('')
  const [materialType,  setMaterialType]  = useState(MATERIAL_TYPES[1])
  const [profileId,     setProfileId]     = useState('general')
  const [difficulty,    setDifficulty]    = useState('Intermedio')
  const [options,       setOptions]       = useState({ emojis: true, steps: true, selfeval: false })
  const [isGenerating,  setIsGenerating]  = useState(false)
  const [material,      setMaterial]      = useState(null)
  const [error,         setError]         = useState(null)
  const [copied,        setCopied]        = useState(false)

  useEffect(() => {
    api.get('/students/')
      .then(({ data }) => setEstudiantes(data))
      .catch(console.error)
  }, [])

  const estudianteSeleccionado = estudiantes.find(e => String(e.id) === profileId)

  function handleGenerate() {
    if (isGenerating || !topic.trim()) {
      if (!topic.trim()) setError('Escribe un tema curricular antes de generar.')
      return
    }
    setIsGenerating(true)
    setError(null)

    api.post('/adapter/generate/', {
      tema: topic.trim(),
      tipo_material: materialType,
      dificultad: difficulty,
      estudiante_id: profileId === 'general' ? null : profileId,
      opciones: options,
    })
      .then(({ data }) => setMaterial(data))
      .catch(() => setError('No se pudo generar el material. Intenta de nuevo.'))
      .finally(() => setIsGenerating(false))
  }

  function handleCopy() {
    if (!material) return
    const c = material.contenido
    const texto = [
      `${c.titulo_emoji} ${c.titulo_linea1} ${c.titulo_linea2 || ''}`,
      '',
      c.intro_texto,
      '',
      'Palabras clave: ' + c.palabras_clave.map(k => k.palabra).join(', '),
      '',
      ...c.pasos.map((p, i) => `${i + 1}. ${p.titulo}: ${p.contenido}`),
      '',
      c.cierre_texto,
    ].join('\n')
    navigator.clipboard.writeText(texto)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function toggleOption(id) {
    setOptions((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const c = material?.contenido

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800" style={{ fontFamily: "'Poppins', sans-serif" }}>
          Generador de Material con IA
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Crea actividades y lecturas personalizadas para cada perfil TDAH en segundos
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 items-start">

        {/* ════════════════ LEFT — Config ════════════════ */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)] p-6 flex flex-col gap-5">

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
                <Sliders size={15} strokeWidth={2} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">Configuración del material</p>
                <p className="text-xs text-slate-400">Personaliza antes de generar</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-600 font-medium">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">📖 Tema curricular</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: La célula, La Revolución Francesa…"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-700 placeholder-slate-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">📄 Tipo de material</label>
              <StyledSelect value={materialType} onChange={setMaterialType} options={MATERIAL_TYPES} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">🧠 Adaptar al perfil</label>
              <StyledSelect
                value={profileId}
                onChange={setProfileId}
                options={[
                  { id: 'general', nombre: 'General para el grupo' },
                  ...estudiantes.map(e => ({ id: String(e.id), nombre: `TDAH ${e.tipo_tdah} (${e.nombre})` })),
                ]}
                getLabel={(opt) => opt.nombre}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">⚡ Nivel de dificultad</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map(({ id, label }) => {
                  const isActive = difficulty === id
                  return (
                    <button
                      key={id}
                      onClick={() => setDifficulty(id)}
                      className={[
                        'flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all duration-150',
                        isActive
                          ? 'border-indigo-400 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700',
                      ].join(' ')}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2">🎨 Opciones extra</label>
              <div className="space-y-2">
                {EXTRA_OPTIONS.map(({ id, label }) => (
                  <label key={id} className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={options[id]}
                      onChange={() => toggleOption(id)}
                      className="w-4 h-4 rounded accent-indigo-600"
                    />
                    <span className="text-xs text-slate-600">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={[
                'w-full py-3.5 rounded-2xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300',
                isGenerating ? 'opacity-80 cursor-not-allowed' : 'hover:brightness-110',
              ].join(' ')}
              style={{
                background: 'linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#6366f1 100%)',
                boxShadow: '0 6px 24px rgba(79,70,229,0.35)',
              }}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Generando…
                </>
              ) : (
                <>
                  <Wand2 size={14} strokeWidth={2} />
                  ✨ Generar Material
                </>
              )}
            </button>
          </div>
        </div>

        {/* ════════════════ RIGHT — Preview ════════════════ */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)] flex flex-col overflow-hidden">

            <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 flex-shrink-0">
              <div>
                <p className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <FileCheck size={14} strokeWidth={2} className="text-emerald-500" />
                  Vista previa del material
                </p>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full inline-block ${material ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                  {material
                    ? `Generado · Optimizado para ${estudianteSeleccionado ? `TDAH ${estudianteSeleccionado.tipo_tdah}` : 'el grupo'}`
                    : 'Sin generar aún'}
                </p>
              </div>

              {material && (
                <div className="flex gap-2 flex-wrap">
                                                     <button
  onClick={() => window.open(`http://localhost:8000/api/adapter/${material.id}/pdf/`, '_blank')}
  className="text-xs font-semibold text-violet-600 bg-violet-50 hover:bg-violet-100 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
>
  <Download size={11} strokeWidth={2} /> PDF
</button>         
		      </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-7 space-y-5 text-slate-700" style={{ maxHeight: 'calc(100vh - 240px)' }}>

              {!material && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <Wand2 size={32} strokeWidth={1.2} />
                  <p className="text-sm">Configura el material y presiona "Generar Material"</p>
                </div>
              )}

              {isGenerating && (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
                  <p className="text-sm">Generando material con IA…</p>
                </div>
              )}

              {material && c && (
                <>
                  {/* Title block */}
                  <div className="text-center pb-5 border-b-2 border-dashed border-slate-200">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-4 py-1.5 rounded-full text-xs font-semibold text-indigo-600 mb-3">
                      <Star size={10} strokeWidth={2.5} />
                      {estudianteSeleccionado
                        ? `Para: ${estudianteSeleccionado.nombre} · ${estudianteSeleccionado.grado} · TDAH ${estudianteSeleccionado.tipo_tdah}`
                        : 'Material general para el grupo'}
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 leading-tight" style={{ fontFamily: "'Poppins', sans-serif" }}>
                      {c.titulo_emoji} {c.titulo_linea1}
                      {c.titulo_linea2 && <><br /><span className="text-indigo-600">{c.titulo_linea2}</span></>}
                    </h2>
                    <p className="text-slate-500 text-sm mt-2">
                      {material.tipo_material} · Nivel {material.dificultad} · {c.duracion_estimada}
                    </p>
                  </div>

                  {/* Intro */}
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-sm leading-relaxed">
                      {c.intro_emoji}{' '}
                      <strong className="text-amber-800">{c.intro_titulo}</strong>
                      <br />
                      <span className="text-slate-700">{c.intro_texto}</span>
                    </p>
                  </div>

                  {/* Keywords */}
                  {c.palabras_clave?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <Key size={11} strokeWidth={2} className="text-indigo-400" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Palabras clave de hoy</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {c.palabras_clave.map((k, i) => (
                          <span key={i} className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-violet-100 text-violet-700 border-violet-200">
                            {k.emoji} {k.palabra}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps */}
                  {c.pasos?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <ListOrdered size={11} strokeWidth={2} className="text-indigo-400" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pasos a seguir</p>
                      </div>
                      <div className="space-y-3">
                        {c.pasos.map((paso, i) => <StepBlock key={i} paso={paso} index={i} />)}
                      </div>
                    </div>
                  )}

                  {/* Autoevaluación */}
                  {c.autoevaluacion?.length > 0 && (
                    <div>
                      <div className="flex items-center gap-1.5 mb-3">
                        <FileCheck size={11} strokeWidth={2} className="text-indigo-400" />
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autoevaluación</p>
                      </div>
                      <div className="space-y-3">
                        {c.autoevaluacion.map((q, i) => (
                          <div key={i} className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                            <p className="text-sm font-semibold text-slate-700 mb-2">{i + 1}. {q.pregunta}</p>
                            <div className="space-y-1.5">
                              {q.opciones?.map((opt, j) => (
                                <label key={j} className="flex items-center gap-2 text-sm text-slate-600">
                                  <input type="radio" name={`q-${i}`} className="accent-indigo-600" />
                                  {opt}
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Cierre */}
                  <div className="p-4 rounded-2xl flex items-start gap-3 border" style={{ background: 'linear-gradient(135deg,#fef3c7,rgba(253,230,138,0.12))', borderColor: '#fde68a' }}>
                    <span className="text-2xl flex-shrink-0">{c.cierre_emoji}</span>
                    <div>
                      <p className="font-semibold text-amber-800 text-sm mb-1">{c.cierre_titulo}</p>
                      <p className="text-sm text-amber-700">{c.cierre_texto}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-dashed border-slate-200">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <Brain size={11} strokeWidth={1.8} className="text-indigo-300" />
                      Generado por EduIA TDAH ·{' '}
                      {new Date(material.creado_en).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

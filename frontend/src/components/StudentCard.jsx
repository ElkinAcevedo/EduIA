import { AlertCircle, ChevronRight, Zap, Eye, Pencil, Trash2 } from 'lucide-react'
/**
 * StudentCard — tarjeta de perfil de estudiante con TDAH
 *
 * Props:
 *  @param {object}   student                 — objeto estudiante desde el backend
 *  @param {number}   student.id
 *  @param {string}   student.name            — nombre completo
 *  @param {string}   student.initials        — 2 letras para el avatar (ej. "MG")
 *  @param {string}   student.type            — subtipo TDAH        (ej. "TDAH Combinado")
 *  @param {number}   student.age             — edad en años
 *  @param {string}   student.grade           — grado escolar       (ej. "3ro B")
 *  @param {number}   student.attention       — 0-100 atención promedio
 *  @param {number}   student.participation   — 0-10 participación
 *  @param {number}   student.alerts          — cantidad de alertas IA activas
 *  @param {string[]} student.strengths       — puntos fuertes      (ej. ["Visual","Creativo"])
 *  @param {string}   [student.avatarGradient]— clases Tailwind para el gradiente del avatar
 *  @param {string}   [variant]               — 'default' | 'compact'
 *  @param {function} [onView]                — callback "Ver detalles"
 *  @param {function} [onAssistant]           — callback "Consultar IA"
 */
export default function StudentCard({
  student = {},
  variant = 'default',
  onView,
  onAssistant,
  onEdit,  
  onDelete,    
}) {
  const {
    name            = 'Sin nombre',
    initials        = '??',
    type            = '—',
    age,
    grade,
    attention       = 0,
    participation   = 0,
    alerts          = 0,
    strengths       = [],
    avatarGradient  = 'from-indigo-400 to-violet-500',
  } = student

  // ── Attention color scale ────────────────────────────────────────────────
  const attentionColor =
    attention >= 70 ? 'text-emerald-600' :
    attention >= 45 ? 'text-amber-500'   :
                      'text-red-500'

  const attentionBarColor =
    attention >= 70 ? 'bg-emerald-400' :
    attention >= 45 ? 'bg-amber-400'   :
                      'bg-red-400'

  // ── Compact variant ──────────────────────────────────────────────────────
  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-all duration-200 cursor-pointer group"
           onClick={onView}>
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-700 truncate leading-tight">{name}</p>
          <p className="text-xs text-slate-400 truncate">{type}</p>
        </div>

        {/* Alerts badge */}
        {alerts > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-500 border border-red-100 flex-shrink-0">
            <AlertCircle size={9} strokeWidth={2.5} />
            {alerts}
          </span>
        )}

        <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors flex-shrink-0" />
      </div>
    )
  }

  // ── Default (full) variant ────────────────────────────────────────────────
  return (
    <div className="student-card bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_36px_rgba(99,102,241,0.13)] hover:border-indigo-100 overflow-hidden">

      {/* Card header */}
      <div className="p-5 pb-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md`}>
            {initials}
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-slate-800 text-sm leading-tight truncate"
               style={{ fontFamily: "'Poppins', sans-serif" }}>
              {name}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">{type}</p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-2">
              {age && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-slate-50 text-slate-500 border border-slate-100">
                  {age} años
                </span>
              )}
              {grade && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                  {grade}
                </span>
              )}
              {alerts > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-red-50 text-red-500 border border-red-100">
                  <AlertCircle size={9} strokeWidth={2.5} />
                  {alerts} alerta{alerts !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="mx-5 border-t border-slate-100" />

      {/* Stats grid */}
      <div className="px-5 py-4 grid grid-cols-3 gap-3">
        {/* Atención */}
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${attentionColor}`}
             style={{ fontFamily: "'Poppins', sans-serif" }}>
            {attention}%
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Atención</p>
        </div>

        {/* Participación */}
        <div className="text-center">
          <p className="text-lg font-bold text-slate-700 leading-none"
             style={{ fontFamily: "'Poppins', sans-serif" }}>
            {participation}<span className="text-xs text-slate-400 font-normal">/10</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Participación</p>
        </div>

        {/* Alertas */}
        <div className="text-center">
          <p className={`text-lg font-bold leading-none ${alerts > 0 ? 'text-red-500' : 'text-slate-400'}`}
             style={{ fontFamily: "'Poppins', sans-serif" }}>
            {alerts}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Alertas IA</p>
        </div>
      </div>

      {/* Attention bar */}
      <div className="px-5 pb-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Atención promedio
          </p>
          <p className={`text-[10px] font-bold ${attentionColor}`}>{attention}%</p>
        </div>
        <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${attentionBarColor}`}
            style={{ width: `${attention}%` }}
          />
        </div>
      </div>

      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <Zap size={11} strokeWidth={2} className="text-amber-400" />
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Puntos fuertes
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {strengths.map((s) => (
              <span
                key={s}
                className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-100"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
	<div className="px-4 pb-4 grid grid-cols-2 gap-2">
	  <button
	    onClick={onAssistant}
	    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 transition-all duration-150"
	  >
	    <Zap size={12} strokeWidth={2.2} />
	    Consultar IA
	  </button>
	  <button
	    onClick={onEdit}
	    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-slate-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all duration-150"
	  >
	    <Pencil size={12} strokeWidth={2.2} />
	    Editar
	  </button>
	  <button
	    onClick={onView}
	    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all duration-150"
	  >
	    <Eye size={12} strokeWidth={2.2} />
	    Ver detalles
	  </button>
	  <button
	    onClick={onDelete}
	    className="flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-100 transition-all duration-150"
	  >
	    <Trash2 size={12} strokeWidth={2.2} />
	    Eliminar
	  </button>
	</div>
		    </div>
	  )
	}

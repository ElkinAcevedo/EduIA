import { useState, useRef, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api'
import {
  Bot, Send, Trash2, ChevronDown, AlertCircle, Zap, User, BookOpenCheck,
} from 'lucide-react'


const mapStudent = (s) => ({
  id:             s.id,
  name:           s.nombre,
  initials:       s.nombre.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
  avatarGradient: 'from-indigo-400 to-violet-500',
  type:           `TDAH ${s.tipo_tdah}`,
  age:            s.edad,
  attention:      s.atencion_promedio ?? 0,
  strengths:      s.fortalezas ?? [],
  alerts:         s.alertas ?? 0,
})


// Consultas rápidas contextuales por estudiante (se pueden extender por perfil)
const QUICK_QUESTIONS = [
  '💬 ¿Estrategias para concentración en lectura?',
  '🎯 ¿Cómo reducir conductas disruptivas?',
  '📊 ¿Qué dice el patrón de esta semana?',
  '✂️ ¿Cómo segmentar las tareas de forma efectiva?',
]

// Mensaje de bienvenida del asistente al cargar o cambiar estudiante
function buildWelcomeMessage(student) {
  return {
    id: Date.now(),
    role: 'ai',
    text: `Hola 👋 Estoy listo para ayudarte con estrategias personalizadas para **${student.name}** (${student.type}, ${student.age} años). Su atención promedio es del **${student.attention}%** y sus puntos fuertes son: ${student.strengths.join(', ')}. ¿Qué necesitas hoy?`,
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers de render de texto markdown básico (negrita, cursiva)
// ─────────────────────────────────────────────────────────────────────────────
function renderText(raw) {
  // **bold** y *italic* básico
  const parts = raw.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="text-slate-800 font-semibold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>
    return part
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ─────────────────────────────────────────────────────────────────────────────

/** Burbuja de mensaje */
function ChatBubble({ message }) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[72%] px-4 py-3 rounded-[18px] rounded-tr-[4px] text-sm leading-relaxed text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)]"
             style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)' }}>
          {message.text}
        </div>
      </div>
    )
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[82%] bg-white border border-slate-100 rounded-[18px] rounded-tl-[4px] px-4 py-3.5 text-sm leading-relaxed text-slate-700 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
        {/* AI label */}
        <div className="flex items-center gap-2 mb-2.5">
          <span className="w-5 h-5 rounded-md bg-indigo-100 flex items-center justify-center flex-shrink-0">
            <Bot size={11} strokeWidth={2} className="text-indigo-500" />
          </span>
          <span className="text-[11px] font-bold text-indigo-600 tracking-wide uppercase">
            Asistente EduIA
          </span>
        </div>
        <p>{renderText(message.text)}</p>
        {message.hint && (
          <p className="mt-3 pt-2.5 border-t border-slate-100 text-[11px] text-slate-400">
            {message.hint}
          </p>
        )}
      </div>
    </div>
  )
}

/** Indicador de escritura */
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-100 rounded-[18px] rounded-tl-[4px] px-4 py-3.5 shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-slate-300 inline-block"
              style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

/** Panel lateral: selector de estudiante + perfil rápido + preguntas */
function ContextPanel({ students, selectedId, onSelectStudent, onQuickQuestion }) {
  const student = students.find((s) => s.id === selectedId)

  const attentionColor =
    student.attention >= 70 ? 'text-emerald-600' :
    student.attention >= 45 ? 'text-amber-500'   : 'text-red-500'

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)] flex flex-col gap-4 p-4 overflow-y-auto">

      {/* Sección: Contexto */}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
        Contexto
      </p>

      {/* Selector de estudiante */}
      <div>
        <label className="block text-xs font-semibold text-slate-600 mb-1.5">
          Estudiante
        </label>
        <div className="relative">
          <select
            value={selectedId}
            onChange={(e) => onSelectStudent(Number(e.target.value))}
            className="w-full appearance-none text-sm border border-slate-200 rounded-xl px-3 py-2.5 pr-8 text-slate-700 bg-slate-50 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all outline-none"
          >
            {students.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tarjeta rápida del estudiante */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${student.avatarGradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm`}>
            {student.initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-700 truncate">{student.name}</p>
            <p className="text-xs text-slate-400 truncate">{student.type} · {student.age} años</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Atención promedio</span>
            <span className={`font-bold ${attentionColor}`}>{student.attention}%</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Puntos fuertes</span>
            <span className="font-semibold text-slate-700 text-right max-w-[55%] truncate">
              {student.strengths.join(', ')}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Alertas activas</span>
            <span className={`font-bold ${student.alerts > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
              {student.alerts > 0 ? `${student.alerts} alerta${student.alerts > 1 ? 's' : ''}` : 'Sin alertas'}
            </span>
          </div>
        </div>
      </div>

      {/* Sección: Consultas rápidas */}
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 mt-1">
        Consultas rápidas
      </p>

      <div className="space-y-2">
        {QUICK_QUESTIONS.map((q, i) => (
          <button
            key={i}
            onClick={() => onQuickQuestion(q)}
            className="w-full text-left text-xs text-slate-600 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 p-2.5 rounded-xl border border-slate-200 hover:border-indigo-200 transition-all leading-relaxed"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Tip de IA */}
      <div className="rounded-xl p-3 mt-auto" style={{ background: 'linear-gradient(135deg,#f0fdf4,#dcfce7)', border: '1px solid #bbf7d0' }}>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Zap size={11} strokeWidth={2} className="text-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tip pedagógico</span>
        </div>
        <p className="text-[11px] text-emerald-700 leading-relaxed">
          Registra el resultado de cada estrategia en la bitácora para que la IA pueda refinar sus recomendaciones.
        </p>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// AssistantView
// ─────────────────────────────────────────────────────────────────────────────
export default function AssistantView() {
  const [searchParams] = useSearchParams()

  const [students,   setStudents]   = useState([])
  const [selectedId, setSelectedId] = useState(Number(searchParams.get('student')) || null)
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef       = useRef(null)

  const student = students.find((s) => s.id === selectedId) ?? null

  // Carga estudiantes
  useEffect(() => {
    api.get('/students/')
      .then((res) => {
        const mapped = res.data.map(mapStudent)
        setStudents(mapped)
        if (!selectedId && mapped.length > 0) {
          setSelectedId(mapped[0].id)
        }
      })
      .catch(console.error)
  }, [])

  // Mensaje de bienvenida cuando cambia el estudiante
  useEffect(() => {
    if (!student) return
    setMessages([buildWelcomeMessage(student)])
  }, [selectedId])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])  // Cambio de estudiante → resetear chat con nuevo mensaje de bienvenida
  const handleSelectStudent = useCallback((id) => {
    setSelectedId(id)
    setInput('')
    inputRef.current?.focus()
  }, [])

  const handleSend = useCallback(async (text) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || loading || !student) return

    const userMsg = { id: Date.now(), role: 'user', text: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)
    inputRef.current?.focus()

    // Historial para mandar al backend (excluye el mensaje de bienvenida)
    const history = messages
      .filter((m) => m.role === 'user' || (m.role === 'ai' && m.id !== messages[0]?.id))
      .map((m) => ({ role: m.role, text: m.text }))

    try {
      const res = await api.post('/assistant/chat/', {
        studentId: student.id,
        message:   trimmed,
        history,
      })
      const aiMsg = {
        id:   Date.now() + 1,
        role: 'ai',
        text: res.data.reply,
        hint: '💡 Registra el resultado en la bitácora para que la IA aprenda del patrón.',
      }
      setMessages((prev) => [...prev, aiMsg])
    } catch (err) {
      setMessages((prev) => [...prev, {
        id:   Date.now() + 1,
        role: 'ai',
        text: 'Ocurrió un error al consultar el asistente. Intenta de nuevo.',
      }])
    } finally {
      setLoading(false)
    }
  }, [input, loading, student, messages])

  const handleQuickQuestion = useCallback((q) => {
    const clean = q.replace(/^[\p{Emoji}\s]+/u, '').trim()
    handleSend(clean)
  }, [handleSend])

  const handleClear = () => {
    if (student) setMessages([buildWelcomeMessage(student)])
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  if (!student) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
    </div>
  )


  return (
    <div className="flex flex-col gap-6 h-full">

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <header>
        <h1
          className="text-2xl font-bold text-slate-800 tracking-tight"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Asistente Pedagógico IA
        </h1>
        <p className="text-slate-500 mt-1 text-sm">
          Consulta estrategias personalizadas para cada estudiante
        </p>
      </header>

      {/* ── BODY: panel lateral + chat ─────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 lg:grid-cols-3 gap-5"
        style={{ height: 'calc(100vh - 220px)', minHeight: '500px' }}
      >

        {/* Panel lateral (1/3) — oculto en mobile */}
        <div className="hidden lg:block overflow-hidden">
          <ContextPanel
            students={students}
            selectedId={selectedId}
            onSelectStudent={handleSelectStudent}
            onQuickQuestion={handleQuickQuestion}
          />
        </div>

        {/* Chat (2/3) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_16px_rgba(15,23,42,0.06)] flex flex-col overflow-hidden">

          {/* Chat header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200 flex-shrink-0">
              <Bot size={16} strokeWidth={2} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">Asistente EduIA</p>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                <span className="text-xs text-slate-400 truncate">
                  En línea · Contexto: {student.name}
                </span>
              </div>
            </div>

            {/* Mobile: selector compacto */}
            <div className="lg:hidden relative">
              <select
                value={selectedId}
                onChange={(e) => handleSelectStudent(Number(e.target.value))}
                className="appearance-none text-xs border border-slate-200 rounded-xl px-3 py-2 pr-7 text-slate-600 bg-slate-50 outline-none"
              >
                {students.map((s) => (
                 <option key={s.id} value={s.id}>{s.name}</option>
               ))}
              </select>
              <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>

            {/* Limpiar chat */}
            <button
              onClick={handleClear}
              title="Limpiar conversación"
              className="w-8 h-8 flex items-center justify-center rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-50 transition-all flex-shrink-0"
            >
              <Trash2 size={14} strokeWidth={1.8} />
            </button>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0 scroll-smooth"
               style={{ scrollbarWidth: 'thin', scrollbarColor: '#c7d2fe transparent' }}>
            {/* Pill de contexto */}
            <div className="flex justify-center">
              <span className="text-[11px] text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                Contexto cargado: {student.name} · {student.type}
              </span>
            </div>

            {messages.map((msg) => (
              <ChatBubble key={msg.id} message={msg} />
            ))}

            {loading && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
            <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-2.5 border border-slate-200 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta pedagógica..."
                disabled={loading}
                className="flex-1 bg-transparent text-sm text-slate-700 placeholder-slate-400 outline-none disabled:opacity-60"
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
              >
                <Send size={13} strokeWidth={2} className="text-white" />
              </button>
            </div>
            <p className="text-center text-[10px] text-slate-400 mt-2">
              Enter para enviar · Las respuestas son generadas por IA y deben revisarse con criterio docente
            </p>
          </div>
        </div>
      </div>

      {/* Animación bounce para typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  )
}

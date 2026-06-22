import { useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Brain,
  LayoutDashboard,
  Users,
  Bot,
  Wand2,
  BookOpenCheck,
  Layers,
  ChevronRight,
  X,
  Menu,
  GraduationCap,
  LogOut,
  Settings,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Nav sections & items ──────────────────────────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Principal',
    items: [
      { to: '/',         icon: LayoutDashboard, label: 'Dashboard'       },
      { to: '/students', icon: Users,            label: 'Mis Estudiantes' },
    ],
  },
  {
    label: 'Herramientas IA',
    items: [
      { to: '/assistant', icon: Bot,           label: 'Asistente IA'       },
      { to: '/adapter',   icon: Wand2,         label: 'Generador Material' },
      { to: '/logbook',   icon: BookOpenCheck, label: 'Bitácora y Análisis' },
      { to: '/bank',      icon: Layers,        label: 'Banco Estrategias'  },
    ],
  },
]

// ── Single nav item ───────────────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, onClick }) {
  const location = useLocation()
  const isActive = to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(to)

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={[
        'group flex items-center gap-3 px-3 py-2.5 mx-2 rounded-xl text-sm font-medium',
        'transition-all duration-200 select-none',
        isActive
          ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm shadow-indigo-100'
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
      ].join(' ')}
    >
      <span
        className={[
          'flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 flex-shrink-0',
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-300'
            : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200 group-hover:text-slate-600',
        ].join(' ')}
      >
        <Icon size={15} strokeWidth={isActive ? 2.2 : 1.8} />
      </span>

      <span className="flex-1 tracking-[-0.01em]">{label}</span>

      {isActive && (
        <ChevronRight size={13} className="text-indigo-400 flex-shrink-0" />
      )}
    </NavLink>
  )
}

// ── Sidebar inner content (shared between desktop & drawer) ───────────────────
function SidebarContent({ onNavClick }) {
  const { usuario, logout } = useAuth()
  const navigate = useNavigate()

  const nombre = usuario?.nombre || 'Docente'
  const grado = usuario?.grado_asignado || ''
  const colegio = usuario?.colegio || ''
  const subtitulo = [grado, colegio].filter(Boolean).join(' · ') || 'Docente'

  const iniciales = nombre
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col h-full">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-200 flex-shrink-0">
            <Brain size={18} className="text-white" strokeWidth={2} />
          </div>
          <div className="leading-tight">
            <p className="font-bold text-slate-800 text-[15px] tracking-tight"
               style={{ fontFamily: "'Poppins', sans-serif" }}>
              EduIA
            </p>
            <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-widest">
              TDAH
            </p>
          </div>
        </div>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 py-4 overflow-y-auto space-y-5">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-5 mb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} onClick={onNavClick} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer — teacher profile */}
      <div className="px-3 py-4 border-t border-slate-100">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 cursor-pointer transition-all duration-200 group"
          title="Cerrar sesión"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-slate-700 truncate leading-tight">
              {nombre}
            </p>
            <p className="text-xs text-slate-400 truncate">{subtitulo}</p>
          </div>
          <LogOut
            size={13}
            className="text-slate-300 group-hover:text-red-500 transition-colors flex-shrink-0"
            strokeWidth={1.8}
          />
        </button>
      </div>

    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function Sidebar() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  const closeDrawer = () => setDrawerOpen(false)
  const toggleDrawer = () => setDrawerOpen((v) => !v)

  return (
    <>
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-100 shadow-[4px_0_24px_rgba(99,102,241,0.05)] z-40">
        <SidebarContent onNavClick={undefined} />
      </aside>

      <button
        onClick={toggleDrawer}
        aria-label="Abrir menú"
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-200 shadow-md text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200"
      >
        {drawerOpen ? <X size={18} strokeWidth={2} /> : <Menu size={18} strokeWidth={2} />}
      </button>

      <div
        onClick={closeDrawer}
        className={[
          'lg:hidden fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-all duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        aria-hidden="true"
      />

      <aside
        className={[
          'lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
        aria-label="Menú de navegación"
      >
        <button
          onClick={closeDrawer}
          aria-label="Cerrar menú"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"
        >
          <X size={16} strokeWidth={2} />
        </button>

        <SidebarContent onNavClick={closeDrawer} />
      </aside>
    </>
  )
}

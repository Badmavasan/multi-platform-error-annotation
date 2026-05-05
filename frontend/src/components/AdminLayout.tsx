import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, FileText, Library, Users, GitBranch, ClipboardList, LogOut } from 'lucide-react'

const nav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/contexts', label: 'Contexts', icon: FileText },
  { to: '/admin/errors', label: 'Error Library', icon: Library },
  { to: '/admin/annotators', label: 'Annotators', icon: Users },
  { to: '/admin/assignments', label: 'Assignments', icon: GitBranch },
  { to: '/admin/annotations', label: 'Annotations', icon: ClipboardList },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const name = localStorage.getItem('user_name') ?? 'Admin'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('role')
    localStorage.removeItem('user_name')
    navigate('/login')
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      <aside
        className="w-56 flex-shrink-0 flex flex-col border-r"
        style={{
          background: 'var(--bg-surface)',
          borderColor: 'var(--border)',
          boxShadow: '2px 0 12px rgba(99,102,241,0.06)',
          position: 'sticky',
          top: 0,
          height: '100vh',
        }}
      >
        <div className="px-5 py-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              EA
            </div>
            <span className="font-display font-semibold text-sm tracking-wide" style={{ color: 'var(--text-primary)' }}>
              Error Annotation
            </span>
          </div>
          <p className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>
            {name} · admin
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <NavLink
              key={to}
              to={to}
              end={exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-display font-medium transition-all duration-150 ${
                  isActive ? 'text-indigo-600' : 'hover:text-[var(--text-primary)]'
                }`
              }
              style={({ isActive }) =>
                isActive
                  ? {
                      color: 'var(--accent)',
                      background: 'linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.04) 100%)',
                      borderLeft: '2px solid var(--accent)',
                      paddingLeft: '10px',
                    }
                  : { color: 'var(--text-secondary)', borderLeft: '2px solid transparent' }
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-display font-medium transition-all hover:bg-[var(--bg-elevated)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

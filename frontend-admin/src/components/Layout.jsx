import { NavLink, useNavigate } from 'react-router-dom'
import { Monitor, Film, LayoutDashboard, LogOut, Wifi, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/devices', label: 'Devices', icon: Monitor },
  { to: '/contents', label: 'Contents', icon: Film },
]

export default function Layout({ children, wsConnected }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Monitor size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-none">Signage CP</p>
              <p className="text-xs text-gray-500 mt-0.5">Control Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-400'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-gray-800 space-y-3">
          {/* WS Status */}
          <div className="flex items-center gap-2 px-2">
            {wsConnected ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-400">Real-time connected</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-gray-500" />
                <span className="text-xs text-gray-500">Connecting...</span>
              </>
            )}
          </div>

          {/* User + Logout */}
          <div className="flex items-center justify-between px-2">
            <div>
              <p className="text-xs font-medium text-gray-300">{user?.email}</p>
              <p className="text-xs text-gray-600">Admin</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-gray-300 transition-colors"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

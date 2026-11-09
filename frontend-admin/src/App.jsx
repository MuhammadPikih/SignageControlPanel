import { Routes, Route, Navigate } from 'react-router-dom'
import { useState, useCallback } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import { useAdminWebSocket } from './hooks/useWebSocket'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import DevicesPage from './pages/DevicesPage'
import ContentsPage from './pages/ContentsPage'

function ProtectedRoutes() {
  const { user, loading } = useAuth()
  const [onlineDevices, setOnlineDevices] = useState(new Set())

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'device:status') {
      setOnlineDevices(prev => {
        const next = new Set(prev)
        if (msg.status === 'online') next.add(msg.deviceId)
        else next.delete(msg.deviceId)
        return next
      })
    } else if (msg.type === 'admin:snapshot') {
      setOnlineDevices(new Set(msg.onlineDevices))
    } else if (msg.type === 'device:heartbeat') {
      setOnlineDevices(prev => {
        const next = new Set(prev)
        next.add(msg.deviceId)
        return next
      })
    }
  }, [])

  const { connected } = useAdminWebSocket(handleWsMessage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  return (
    <Layout wsConnected={connected}>
      <Routes>
        <Route path="/" element={<DashboardPage onlineDevices={onlineDevices} />} />
        <Route path="/devices" element={<DevicesPage onlineDevices={onlineDevices} />} />
        <Route path="/contents" element={<ContentsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPageWrapper />} />
        <Route path="/*" element={<ProtectedRoutes />} />
      </Routes>
    </AuthProvider>
  )
}

function LoginPageWrapper() {
  const { user } = useAuth()
  if (user) return <Navigate to="/" replace />
  return <LoginPage />
}

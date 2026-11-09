import { useState, useCallback, useEffect } from 'react'
import { useDeviceWebSocket } from './useDeviceWebSocket'

const API_BASE = 'http://localhost:3001'

// ─── Content Renderers ────────────────────────────────────────────────────────

function ImageContent({ payload }) {
  const src = payload?.startsWith('/uploads') ? API_BASE + payload : payload
  return (
    <div className="w-full h-full flex items-center justify-center bg-black">
      <img src={src} alt="" className="max-w-full max-h-full object-contain" />
    </div>
  )
}

function VideoContent({ payload }) {
  const src = payload?.startsWith('/uploads') ? API_BASE + payload : payload
  return (
    <video
      src={src}
      className="w-full h-full object-contain bg-black"
      autoPlay
      muted
      loop
      playsInline
    />
  )
}

function UrlContent({ payload }) {
  return (
    <iframe
      src={payload}
      className="w-full h-full border-0"
      title="Web Content"
      sandbox="allow-scripts allow-same-origin"
    />
  )
}

function TextContent({ payload }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-black p-16">
      <p className="text-white text-4xl font-bold text-center leading-relaxed">{payload}</p>
    </div>
  )
}

function ContentRenderer({ content }) {
  if (!content) return null
  switch (content.tipe) {
    case 'image': return <ImageContent payload={content.payload} />
    case 'video': return <VideoContent payload={content.payload} />
    case 'url':   return <UrlContent payload={content.payload} />
    case 'text':  return <TextContent payload={content.payload} />
    default:      return <p className="text-white text-2xl">{content.judul}</p>
  }
}

// ─── Playlist Player ─────────────────────────────────────────────────────────

function PlaylistPlayer({ playlist }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    setIndex(0)
  }, [playlist])

  useEffect(() => {
    if (!playlist || playlist.length === 0) return
    const item = playlist[index]
    const duration = (item?.duration || 10) * 1000
    const timer = setTimeout(() => {
      setIndex((i) => (i + 1) % playlist.length)
    }, duration)
    return () => clearTimeout(timer)
  }, [index, playlist])

  if (!playlist || playlist.length === 0) return null
  const current = playlist[index]
  return (
    <div className="w-full h-full relative">
      <ContentRenderer content={current?.contents || current} />
      {/* Playlist indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {playlist.map((_, i) => (
          <span
            key={i}
            className={`w-2 h-2 rounded-full transition-all ${i === index ? 'bg-white scale-125' : 'bg-white/30'}`}
          />
        ))}
      </div>
    </div>
  )
}

// ─── Setup Screen ─────────────────────────────────────────────────────────────

function SetupScreen({ onConnect }) {
  const [deviceId, setDeviceId] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (deviceId.trim()) onConnect(deviceId.trim())
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white">Signage Device Client</h1>
          <p className="text-gray-400 text-sm mt-2">Masukkan Device ID untuk mulai</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Device ID</label>
            <input
              type="text"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Paste UUID device dari dashboard"
              required
            />
            <p className="text-xs text-gray-600 mt-1">
              Dapatkan Device ID dari halaman Devices di admin dashboard
            </p>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
          >
            Hubungkan
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── Connection Status Overlay ────────────────────────────────────────────────

function StatusBadge({ status }) {
  const colors = {
    connected: 'bg-emerald-600',
    connecting: 'bg-yellow-600',
    disconnected: 'bg-red-600',
  }
  const labels = {
    connected: 'Connected',
    connecting: 'Connecting...',
    disconnected: 'Disconnected — Reconnecting',
  }
  return (
    <div className={`fixed top-3 right-3 px-3 py-1 rounded-full text-xs font-medium text-white ${colors[status]} z-50 opacity-80`}>
      {labels[status]}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [deviceId, setDeviceId] = useState(() => localStorage.getItem('deviceId') || '')
  const [mode, setMode] = useState(null) // null | 'single' | 'playlist'
  const [currentContent, setCurrentContent] = useState(null)
  const [playlist, setPlaylist] = useState([])

  const handleCommand = useCallback((msg) => {
    if (msg.type === 'command:show') {
      setMode('single')
      setCurrentContent(msg.content)
    } else if (msg.type === 'command:playlist') {
      setMode('playlist')
      setPlaylist(msg.playlist)
    }
  }, [])

  const { status } = useDeviceWebSocket(deviceId, handleCommand)

  const handleConnect = (id) => {
    localStorage.setItem('deviceId', id)
    setDeviceId(id)
  }

  const handleDisconnect = () => {
    localStorage.removeItem('deviceId')
    setDeviceId('')
    setMode(null)
    setCurrentContent(null)
  }

  if (!deviceId) {
    return <SetupScreen onConnect={handleConnect} />
  }

  return (
    <div className="w-screen h-screen bg-black relative overflow-hidden">
      <StatusBadge status={status} />

      {/* Disconnect button (dev helper) */}
      <button
        onClick={handleDisconnect}
        className="fixed top-3 left-3 px-3 py-1 rounded-full text-xs text-gray-600 hover:text-gray-400 z-50 opacity-50 hover:opacity-100 transition-opacity"
        title="Disconnect device"
      >
        ✕ Disconnect
      </button>

      {/* Device ID watermark */}
      <div className="fixed bottom-2 left-2 text-xs text-gray-700 z-50 font-mono">
        {deviceId.slice(0, 8)}...
      </div>

      {/* Content area */}
      {mode === null && (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-950">
          <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-6" />
          <h2 className="text-white text-2xl font-semibold">Menunggu Konten...</h2>
          <p className="text-gray-500 text-sm mt-2">Device terhubung. Tekan push dari admin dashboard.</p>
          <p className="text-gray-700 font-mono text-xs mt-4">{deviceId}</p>
        </div>
      )}

      {mode === 'single' && currentContent && (
        <ContentRenderer content={currentContent} />
      )}

      {mode === 'playlist' && playlist.length > 0 && (
        <PlaylistPlayer playlist={playlist} />
      )}
    </div>
  )
}

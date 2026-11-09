import { useEffect, useState } from 'react'
import { getDevices, getContents } from '../api'
import { Monitor, Film, Wifi, WifiOff, Clock } from 'lucide-react'
import { Link } from 'react-router-dom'

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  )
}

export default function DashboardPage({ onlineDevices }) {
  const [devices, setDevices] = useState([])
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDevices(), getContents()])
      .then(([d, c]) => {
        setDevices(d.data)
        setContents(c.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const onlineCount = onlineDevices.size
  const offlineCount = devices.length - onlineCount

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview sistem signage Anda</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Monitor} label="Total Devices" value={devices.length} color="bg-brand-600/20 text-brand-400" />
        <StatCard icon={Wifi} label="Online" value={onlineCount} color="bg-emerald-900/50 text-emerald-400" />
        <StatCard icon={WifiOff} label="Offline" value={offlineCount} color="bg-red-900/50 text-red-400" />
        <StatCard icon={Film} label="Contents" value={contents.length} color="bg-violet-900/50 text-violet-400" />
      </div>

      {/* Device list */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Status Device</h2>
          <Link to="/devices" className="text-xs text-brand-400 hover:text-brand-300">Lihat semua →</Link>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : devices.length === 0 ? (
          <p className="text-sm text-gray-500">Belum ada device terdaftar.</p>
        ) : (
          <div className="space-y-2">
            {devices.map((d) => {
              const isOnline = onlineDevices.has(d.id)
              return (
                <div key={d.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 shadow-sm shadow-emerald-500/50 animate-pulse' : 'bg-gray-600'}`} />
                    <div>
                      <p className="text-sm font-medium text-white">{d.nama}</p>
                      <p className="text-xs text-gray-500">{d.lokasi}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-right">
                    <span className={isOnline ? 'badge-online' : 'badge-offline'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                    {d.last_seen && (
                      <span className="text-xs text-gray-600 hidden sm:block">
                        {new Date(d.last_seen).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Recent Contents */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Konten Terbaru</h2>
          <Link to="/contents" className="text-xs text-brand-400 hover:text-brand-300">Lihat semua →</Link>
        </div>
        {loading ? (
          <p className="text-sm text-gray-500">Memuat...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contents.slice(0, 6).map((c) => (
              <div key={c.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 uppercase">
                  {c.tipe.slice(0, 3)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-white truncate">{c.judul}</p>
                  <p className="text-xs text-gray-500">{new Date(c.created_at).toLocaleDateString('id-ID')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

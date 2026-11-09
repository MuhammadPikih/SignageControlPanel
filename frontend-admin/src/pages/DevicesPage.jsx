import { useEffect, useState, useCallback } from 'react'
import { getDevices, createDevice, updateDevice, deleteDevice, pushContent, getPlaylist, addToPlaylist, removeFromPlaylist, pushPlaylist, getContents } from '../api'
import { Plus, Pencil, Trash2, Send, List, X, Play, Monitor } from 'lucide-react'
import toast from 'react-hot-toast'

function DeviceModal({ device, onClose, onSave }) {
  const [form, setForm] = useState({ nama: device?.nama || '', lokasi: device?.lokasi || '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  // Close modal saat klik backdrop
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={handleBackdropClick}
    >
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">{device ? 'Edit Device' : 'Tambah Device'}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Nama Device</label>
            <input
              className="input"
              value={form.nama}
              onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
              placeholder="Lobby Display 1"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label">Lokasi</label>
            <input
              className="input"
              value={form.lokasi}
              onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))}
              placeholder="Lantai 1 - Lobby"
              required
            />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function PushModal({ device, onClose }) {
  const [contents, setContents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getContents()
      .then(r => setContents(r.data))
      .catch(() => toast.error('Gagal memuat konten'))
  }, [])

  const handlePush = async () => {
    if (!selectedId) return
    setLoading(true)
    try {
      await pushContent(device.id, selectedId)
      toast.success('Konten berhasil dikirim ke device!')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal push konten')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={handleBackdropClick}
    >
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-white">Push Konten</h2>
            <p className="text-xs text-gray-400 mt-0.5">ke: {device.nama}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Pilih Konten</label>
            <select
              className="input"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">-- Pilih konten --</option>
              {contents.map(c => (
                <option key={c.id} value={c.id}>{c.judul} ({c.tipe})</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button
              type="button"
              onClick={handlePush}
              className="btn-primary"
              disabled={!selectedId || loading}
            >
              <Send size={14} />
              {loading ? 'Mengirim...' : 'Push'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function PlaylistModal({ device, onClose }) {
  const [playlist, setPlaylist] = useState([])
  const [contents, setContents] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [duration, setDuration] = useState(10)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    getPlaylist(device.id).then(r => setPlaylist(r.data)).catch(() => {})
    getContents().then(r => setContents(r.data)).catch(() => {})
  }, [device.id])

  useEffect(() => { load() }, [load])

  const handleAdd = async () => {
    if (!selectedId) return
    try {
      await addToPlaylist(device.id, {
        contentId: selectedId,
        orderIndex: playlist.length,
        duration: Number(duration),
      })
      toast.success('Ditambahkan ke playlist')
      setSelectedId('')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menambahkan')
    }
  }

  const handleRemove = async (playlistId) => {
    try {
      await removeFromPlaylist(device.id, playlistId)
      load()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const handlePushPlaylist = async () => {
    setLoading(true)
    try {
      await pushPlaylist(device.id)
      toast.success('Playlist dikirim ke device!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal push playlist')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4"
      onClick={handleBackdropClick}
    >
      <div className="card w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-semibold text-white">Kelola Playlist</h2>
            <p className="text-xs text-gray-400 mt-0.5">{device.nama}</p>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <X size={18} />
          </button>
        </div>

        {/* Add to playlist */}
        <div className="flex gap-2 mb-4">
          <select
            className="input flex-1"
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
          >
            <option value="">-- Pilih konten --</option>
            {contents.map(c => (
              <option key={c.id} value={c.id}>{c.judul}</option>
            ))}
          </select>
          <input
            type="number"
            className="input w-20"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            min={1}
            title="Durasi (detik)"
          />
          <button
            type="button"
            onClick={handleAdd}
            className="btn-primary"
            disabled={!selectedId}
          >
            <Plus size={14} />
          </button>
        </div>

        {/* Playlist items */}
        <div className="flex-1 overflow-y-auto space-y-1.5 min-h-0">
          {playlist.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Playlist kosong</p>
          ) : (
            playlist.map((item, i) => (
              <div key={item.id} className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
                <span className="text-xs text-gray-500 w-5 text-center">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{item.contents?.judul}</p>
                  <p className="text-xs text-gray-500">{item.contents?.tipe} • {item.duration}s</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-red-500 hover:text-red-400 p-1"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-4 border-t border-gray-800 flex justify-between">
          <button type="button" onClick={onClose} className="btn-secondary">Tutup</button>
          <button
            type="button"
            onClick={handlePushPlaylist}
            className="btn-primary"
            disabled={playlist.length === 0 || loading}
          >
            <Play size={14} />
            {loading ? 'Mengirim...' : 'Push Playlist ke Device'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DevicesPage({ onlineDevices }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'add' | 'edit' | 'push' | 'playlist'
  const [selected, setSelected] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    getDevices()
      .then(r => setDevices(r.data))
      .catch(err => toast.error(err.response?.data?.error || 'Gagal memuat devices'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (form) => {
    await createDevice(form)
    toast.success('Device ditambahkan')
    load()
  }

  const handleUpdate = async (form) => {
    await updateDevice(selected.id, form)
    toast.success('Device diperbarui')
    load()
  }

  const handleDelete = async (device) => {
    if (!confirm(`Hapus device "${device.nama}"?`)) return
    try {
      await deleteDevice(device.id)
      toast.success('Device dihapus')
      load()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal menghapus')
    }
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Devices</h1>
          <p className="text-gray-500 text-sm mt-1">{devices.length} device terdaftar</p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Tambah Device
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-gray-500 py-8">
          <div className="w-5 h-5 border-2 border-gray-600 border-t-brand-500 rounded-full animate-spin" />
          Memuat devices...
        </div>
      ) : devices.length === 0 ? (
        <div className="card text-center py-12">
          <Monitor size={40} className="mx-auto text-gray-700 mb-3" />
          <p className="text-gray-500">Belum ada device. Tambahkan device baru.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((d) => {
            const isOnline = onlineDevices.has(d.id)
            return (
              <div key={d.id} className="card hover:border-gray-700 transition-colors group">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600'}`} />
                    <span className={isOnline ? 'badge-online' : 'badge-offline'}>
                      {isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => { setSelected(d); setModal('edit') }}
                      className="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200"
                      title="Edit"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(d)}
                      className="p-1.5 rounded hover:bg-red-900/50 text-gray-500 hover:text-red-400"
                      title="Hapus"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <h3 className="font-semibold text-white">{d.nama}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{d.lokasi}</p>

                {d.last_seen && (
                  <p className="text-xs text-gray-600 mt-2">
                    Last seen: {new Date(d.last_seen).toLocaleString('id-ID')}
                  </p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => { setSelected(d); setModal('push') }}
                    className="btn-secondary flex-1 justify-center text-xs py-1.5"
                    disabled={!isOnline}
                    title={!isOnline ? 'Device harus online' : 'Push konten ke device'}
                  >
                    <Send size={12} /> Push Konten
                  </button>
                  <button
                    type="button"
                    onClick={() => { setSelected(d); setModal('playlist') }}
                    className="btn-secondary flex-1 justify-center text-xs py-1.5"
                    title="Kelola playlist"
                  >
                    <List size={12} /> Playlist
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modal === 'add' && (
        <DeviceModal onClose={closeModal} onSave={handleCreate} />
      )}
      {modal === 'edit' && selected && (
        <DeviceModal device={selected} onClose={closeModal} onSave={handleUpdate} />
      )}
      {modal === 'push' && selected && (
        <PushModal device={selected} onClose={closeModal} />
      )}
      {modal === 'playlist' && selected && (
        <PlaylistModal device={selected} onClose={closeModal} />
      )}
    </div>
  )
}

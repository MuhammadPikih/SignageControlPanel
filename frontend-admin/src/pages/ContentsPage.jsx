import { useEffect, useState, useCallback } from 'react'
import { getContents, createContent, updateContent, deleteContent } from '../api'
import { Plus, Pencil, Trash2, X, Image, Video, Globe, Type } from 'lucide-react'
import toast from 'react-hot-toast'

const TYPES = [
  { value: 'image', label: 'Gambar', icon: Image, color: 'text-blue-400' },
  { value: 'video', label: 'Video', icon: Video, color: 'text-purple-400' },
  { value: 'url', label: 'URL / Web', icon: Globe, color: 'text-green-400' },
  { value: 'text', label: 'Teks', icon: Type, color: 'text-yellow-400' },
]

function ContentModal({ content, onClose, onSave }) {
  const [form, setForm] = useState({
    judul: content?.judul || '',
    tipe: content?.tipe || 'image',
    url: '',
  })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const needsFile = ['image', 'video'].includes(form.tipe)

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('judul', form.judul)
      fd.append('tipe', form.tipe)
      if (file) fd.append('file', file)
      else if (form.url) fd.append('url', form.url)
      await onSave(fd)
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 px-4" onClick={handleBackdropClick}>
      <div className="card w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-white">{content ? 'Edit Konten' : 'Tambah Konten'}</h2>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-300"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Judul</label>
            <input className="input" value={form.judul} onChange={e => setForm(f => ({ ...f, judul: e.target.value }))} placeholder="Nama konten" required />
          </div>
          <div>
            <label className="label">Tipe</label>
            <select className="input" value={form.tipe} onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}>
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          {needsFile ? (
            <div>
              <label className="label">Upload File</label>
              <input
                type="file"
                accept={form.tipe === 'image' ? 'image/*' : 'video/*'}
                className="input"
                onChange={e => setFile(e.target.files[0])}
              />
              {content?.payload && !file && (
                <p className="text-xs text-gray-500 mt-1">File saat ini: {content.payload}</p>
              )}
            </div>
          ) : (
            <div>
              <label className="label">{form.tipe === 'url' ? 'URL' : 'Teks Konten'}</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={form.url}
                onChange={e => setForm(f => ({ ...f, url: e.target.value }))}
                placeholder={form.tipe === 'url' ? 'https://...' : 'Tulis teks di sini...'}
              />
              {content?.payload && (
                <p className="text-xs text-gray-500 mt-1">Saat ini: {content.payload}</p>
              )}
            </div>
          )}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Batal</button>
            <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ContentCard({ content, onEdit, onDelete }) {
  const type = TYPES.find(t => t.value === content.tipe) || TYPES[0]
  const Icon = type.icon
  const BASE = 'http://localhost:3001'

  const renderPreview = () => {
    if (content.tipe === 'image' && content.payload) {
      const src = content.payload.startsWith('/uploads') ? BASE + content.payload : content.payload
      return <img src={src} alt={content.judul} className="w-full h-32 object-cover rounded-lg" />
    }
    if (content.tipe === 'video' && content.payload) {
      const src = content.payload.startsWith('/uploads') ? BASE + content.payload : content.payload
      return <video src={src} className="w-full h-32 object-cover rounded-lg" muted />
    }
    return (
      <div className="w-full h-32 bg-gray-800 rounded-lg flex items-center justify-center">
        <Icon size={32} className={type.color} />
      </div>
    )
  }

  return (
    <div className="card group hover:border-gray-700 transition-colors">
      {renderPreview()}
      <div className="mt-3 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-medium text-white truncate">{content.judul}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Icon size={11} className={type.color} />
            <span className="text-xs text-gray-500">{type.label}</span>
          </div>
          <p className="text-xs text-gray-600 mt-1">{new Date(content.created_at).toLocaleDateString('id-ID')}</p>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => onEdit(content)} className="p-1.5 rounded hover:bg-gray-700 text-gray-500 hover:text-gray-200">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(content)} className="p-1.5 rounded hover:bg-red-900/50 text-gray-500 hover:text-red-400">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ContentsPage() {
  const [contents, setContents] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // 'add' | 'edit'
  const [selected, setSelected] = useState(null)
  const [filter, setFilter] = useState('all')

  const load = useCallback(() => {
    getContents().then(r => setContents(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const handleCreate = async (fd) => {
    await createContent(fd)
    toast.success('Konten ditambahkan')
    load()
  }

  const handleUpdate = async (fd) => {
    await updateContent(selected.id, fd)
    toast.success('Konten diperbarui')
    load()
  }

  const handleDelete = async (content) => {
    if (!confirm(`Hapus konten "${content.judul}"?`)) return
    try {
      await deleteContent(content.id)
      toast.success('Konten dihapus')
      load()
    } catch {
      toast.error('Gagal menghapus')
    }
  }

  const filtered = filter === 'all' ? contents : contents.filter(c => c.tipe === filter)

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Contents</h1>
          <p className="text-gray-500 text-sm mt-1">{contents.length} konten tersedia</p>
        </div>
        <button className="btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Tambah Konten
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-lg p-1 w-fit">
        {[{ value: 'all', label: 'Semua' }, ...TYPES].map(t => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === t.value ? 'bg-brand-600 text-white' : 'text-gray-400 hover:text-gray-200'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Memuat...</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500">Tidak ada konten.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map(c => (
            <ContentCard
              key={c.id}
              content={c}
              onEdit={c => { setSelected(c); setModal('edit') }}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {modal === 'add' && <ContentModal onClose={() => setModal(null)} onSave={handleCreate} />}
      {modal === 'edit' && selected && <ContentModal content={selected} onClose={() => setModal(null)} onSave={handleUpdate} />}
    </div>
  )
}

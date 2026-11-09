# Signage Control Panel

Aplikasi digital signage management system dengan fitur real-time monitoring, content management, dan device control.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Node.js, Express, WebSocket (ws), JWT |
| Frontend Admin | React 18, Vite, TailwindCSS |
| Device Client | React 18, Vite, Electron |
| Database | Supabase (PostgreSQL) |
| Real-time | WebSocket |

## Struktur Proyek

```
signage-control-panel/
├── backend/              ← Express API + WebSocket Server
│   ├── src/
│   │   ├── index.js
│   │   ├── supabase.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── devices.routes.js
│   │   │   └── contents.routes.js
│   │   ├── middleware/
│   │   │   └── auth.middleware.js
│   │   └── services/
│   │       └── websocket.service.js
│   ├── supabase-schema.sql
│   └── uploads/          ← File uploads (auto-created)
├── frontend-admin/       ← Dashboard Admin (React)
└── device-client/        ← Device Client (React + Electron)
```

## Setup

### 1. Supabase

1. Buat project di [supabase.com](https://supabase.com)
2. Jalankan query dari `backend/supabase-schema.sql` di Supabase SQL Editor
3. Copy **Project URL** dan **service_role key** dari Settings → API

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env dengan Supabase credentials Anda
npm install
npm run dev
```

Backend berjalan di `http://localhost:3001`

### 3. Frontend Admin

```bash
cd frontend-admin
npm install
npm run dev
```

Dashboard berjalan di `http://localhost:5173`

Login default: `admin@signage.local` / `admin123`

### 4. Device Client (Web)

```bash
cd device-client
npm install
npm run dev
```

Berjalan di `http://localhost:5174`

### 5. Device Client (Electron)

```bash
cd device-client
npm run electron:dev
```

## Fitur

### ✅ Requirement Wajib
- **Database Supabase**: Tabel `devices`, `contents`, `device_playlists`
- **REST API CRUD**: Endpoints untuk devices dan contents
- **WebSocket Real-time**: Status online/offline device diperbarui real-time
- **Dashboard Admin**: Kelola device, content, push konten
- **Device Client**: Menampilkan konten yang di-push

### ⭐ Bonus
- **Playlist**: Kelola playlist per device + push playlist ke device
- **Push Content**: Command push konten langsung ke device tertentu
- **JWT Auth**: Login dengan JWT untuk dashboard admin
- **Electron**: Device client bisa dijalankan sebagai desktop app
- **Auto Reconnect**: Device client reconnect otomatis dengan exponential backoff

## API Endpoints

### Auth
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| POST | `/api/auth/login` | Login admin |
| GET | `/api/auth/me` | Get current user |

### Devices
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/devices` | List semua device |
| POST | `/api/devices` | Tambah device |
| PUT | `/api/devices/:id` | Update device |
| DELETE | `/api/devices/:id` | Hapus device |
| POST | `/api/devices/:id/push` | Push konten ke device |
| GET | `/api/devices/:id/playlist` | Get playlist device |
| POST | `/api/devices/:id/playlist` | Tambah ke playlist |
| DELETE | `/api/devices/:id/playlist/:pid` | Hapus dari playlist |
| POST | `/api/devices/:id/playlist/push` | Push playlist ke device |

### Contents
| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| GET | `/api/contents` | List semua konten |
| POST | `/api/contents` | Tambah konten (support upload file) |
| PUT | `/api/contents/:id` | Update konten |
| DELETE | `/api/contents/:id` | Hapus konten |

## WebSocket Protocol

### Client → Server
```json
{ "type": "device:register", "deviceId": "uuid" }
{ "type": "device:heartbeat", "deviceId": "uuid" }
{ "type": "admin:subscribe" }
```

### Server → Client
```json
{ "type": "device:status", "deviceId": "uuid", "status": "online|offline" }
{ "type": "device:heartbeat", "deviceId": "uuid", "lastSeen": "ISO" }
{ "type": "admin:snapshot", "onlineDevices": ["uuid", ...] }
{ "type": "command:show", "content": {...} }
{ "type": "command:playlist", "playlist": [...] }
```

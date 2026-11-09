require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

// ─── Validasi ENV ─────────────────────────────────────────────────────────────
const requiredEnv = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(k => !process.env[k] || process.env[k].includes('your-'));
if (missingEnv.length > 0) {
  console.error('\n❌ ERROR: Konfigurasi .env tidak lengkap!');
  console.error('   Variable yang belum diisi:', missingEnv.join(', '));
  console.error('   Edit file backend/.env dan isi dengan nilai Supabase Anda.\n');
  process.exit(1);
}

const { initWebSocket } = require('./services/websocket.service');

const authRoutes = require('./routes/auth.routes');
const devicesRoutes = require('./routes/devices.routes');
const contentsRoutes = require('./routes/contents.routes');

const app = express();

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/devices', devicesRoutes);
app.use('/api/contents', contentsRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

// ─── HTTP + WebSocket Server ──────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const server = http.createServer(app);

initWebSocket(server);

server.listen(PORT, () => {
  console.log(`[API] Server running on http://localhost:${PORT}`);
  console.log(`[WS]  WebSocket ready on ws://localhost:${PORT}`);
});

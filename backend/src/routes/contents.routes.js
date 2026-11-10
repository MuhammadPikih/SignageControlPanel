const router = require('express').Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer setup — store uploads in /uploads
const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|mp4|webm|ogg|pdf/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (allowed.test(ext)) return cb(null, true);
    cb(new Error('File type not supported'));
  },
});

// Helper: normalize DB row — rename payload_url → payload untuk konsistensi frontend
function normalize(row) {
  if (!row) return row;
  if ('payload_url' in row && !('payload' in row)) {
    row.payload = row.payload_url;
    delete row.payload_url;
  }
  return row;
}

// GET /api/contents — list all
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data.map(normalize));
});

// GET /api/contents/:id — single content
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Content not found' });
  return res.json(normalize(data));
});

// POST /api/contents — create (with optional file upload)
router.post('/', auth, upload.single('file'), async (req, res) => {
  const { judul, tipe, url } = req.body;

  if (!judul || !tipe) {
    return res.status(400).json({ error: 'judul and tipe are required' });
  }

  let payloadValue = url || null;
  if (req.file) {
    payloadValue = `/uploads/${req.file.filename}`;
  }

  const { data, error } = await supabase
    .from('contents')
    .insert([{ judul, tipe, payload_url: payloadValue }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(normalize(data));
});

// PUT /api/contents/:id — update
router.put('/:id', auth, upload.single('file'), async (req, res) => {
  const { judul, tipe, url } = req.body;
  const updates = {};

  if (judul) updates.judul = judul;
  if (tipe) updates.tipe = tipe;
  if (url) updates.payload_url = url;
  if (req.file) updates.payload_url = `/uploads/${req.file.filename}`;

  const { data, error } = await supabase
    .from('contents')
    .update(updates)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(normalize(data));
});

// DELETE /api/contents/:id — delete
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('contents')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Content deleted' });
});

module.exports = router;

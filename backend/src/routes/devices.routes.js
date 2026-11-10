const router = require('express').Router();
const supabase = require('../supabase');
const auth = require('../middleware/auth.middleware');
const { pushToDevice, deviceConnections } = require('../services/websocket.service');

// Normalize content row: payload_url → payload (agar konsisten di frontend & device client)
function normalizeContent(row) {
  if (!row) return row;
  if ('payload_url' in row && !('payload' in row)) {
    row.payload = row.payload_url;
    delete row.payload_url;
  }
  return row;
}

// Normalize playlist items (nested contents)
function normalizePlaylist(rows) {
  return rows.map(item => {
    if (item.contents) item.contents = normalizeContent({ ...item.contents });
    return item;
  });
}

// GET /api/devices — list all
router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('nama', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// GET /api/devices/:id — single device
router.get('/:id', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error) return res.status(404).json({ error: 'Device not found' });
  return res.json(data);
});

// POST /api/devices — create
router.post('/', auth, async (req, res) => {
  const { nama, lokasi } = req.body;
  if (!nama || !lokasi) {
    return res.status(400).json({ error: 'nama and lokasi are required' });
  }

  const { data, error } = await supabase
    .from('devices')
    .insert([{ nama, lokasi, status: 'offline' }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// PUT /api/devices/:id — update
router.put('/:id', auth, async (req, res) => {
  const { nama, lokasi } = req.body;

  const { data, error } = await supabase
    .from('devices')
    .update({ nama, lokasi })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// DELETE /api/devices/:id — delete
router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase
    .from('devices')
    .delete()
    .eq('id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Device deleted' });
});

// POST /api/devices/:id/push — push content/command to device via WS
router.post('/:id/push', auth, async (req, res) => {
  const { contentId } = req.body;
  const deviceId = req.params.id;

  // Fetch content details
  const { data: content, error } = await supabase
    .from('contents')
    .select('*')
    .eq('id', contentId)
    .single();

  if (error || !content) {
    return res.status(404).json({ error: 'Content not found' });
  }

  const normalizedContent = normalizeContent({ ...content });

  const sent = pushToDevice(deviceId, {
    type: 'command:show',
    content: normalizedContent,
    timestamp: Date.now(),
  });

  if (!sent) {
    return res.status(503).json({ error: 'Device is not connected' });
  }

  return res.json({ message: 'Content pushed to device', content: normalizedContent });
});

// GET /api/devices/:id/playlist — get device playlist
router.get('/:id/playlist', auth, async (req, res) => {
  const { data, error } = await supabase
    .from('device_playlists')
    .select('*, contents(*)')
    .eq('device_id', req.params.id)
    .order('order_index', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });
  return res.json(normalizePlaylist(data));
});

// POST /api/devices/:id/playlist — add content to playlist
router.post('/:id/playlist', auth, async (req, res) => {
  const { contentId, orderIndex, duration } = req.body;

  const { data, error } = await supabase
    .from('device_playlists')
    .insert([{
      device_id: req.params.id,
      content_id: contentId,
      order_index: orderIndex ?? 0,
      duration: duration ?? 10,
    }])
    .select('*, contents(*)')
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(201).json(data);
});

// DELETE /api/devices/:id/playlist/:playlistId — remove from playlist
router.delete('/:id/playlist/:playlistId', auth, async (req, res) => {
  const { error } = await supabase
    .from('device_playlists')
    .delete()
    .eq('id', req.params.playlistId)
    .eq('device_id', req.params.id);

  if (error) return res.status(500).json({ error: error.message });
  return res.json({ message: 'Removed from playlist' });
});

// POST /api/devices/:id/playlist/push — push entire playlist to device
router.post('/:id/playlist/push', auth, async (req, res) => {
  const deviceId = req.params.id;

  const { data: playlist, error } = await supabase
    .from('device_playlists')
    .select('*, contents(*)')
    .eq('device_id', deviceId)
    .order('order_index', { ascending: true });

  if (error) return res.status(500).json({ error: error.message });

  const sent = pushToDevice(deviceId, {
    type: 'command:playlist',
    playlist: normalizePlaylist(playlist),
    timestamp: Date.now(),
  });

  if (!sent) {
    return res.status(503).json({ error: 'Device is not connected' });
  }

  return res.json({ message: 'Playlist pushed to device', count: playlist.length });
});

module.exports = router;

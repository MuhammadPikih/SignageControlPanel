const WebSocket = require('ws');
const supabase = require('../supabase');

let wss = null;

// Map: deviceId -> { ws, lastSeen }
const deviceConnections = new Map();
// Map: adminWs -> true
const adminClients = new Set();

/**
 * Initialize WebSocket server on given httpServer
 */
function initWebSocket(httpServer) {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, req) => {
    console.log('[WS] New connection');

    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        return;
      }

      switch (msg.type) {
        case 'device:register':
          await handleDeviceRegister(ws, msg);
          break;
        case 'device:heartbeat':
          await handleDeviceHeartbeat(ws, msg);
          break;
        case 'admin:subscribe':
          handleAdminSubscribe(ws);
          break;
        default:
          break;
      }
    });

    ws.on('close', async () => {
      // Check if this was a device connection
      for (const [deviceId, conn] of deviceConnections.entries()) {
        if (conn.ws === ws) {
          deviceConnections.delete(deviceId);
          console.log(`[WS] Device offline: ${deviceId}`);
          await updateDeviceStatus(deviceId, 'offline');
          broadcastToAdmins({
            type: 'device:status',
            deviceId,
            status: 'offline',
            lastSeen: new Date().toISOString(),
          });
          break;
        }
      }

      adminClients.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });

    // Send ack
    ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
  });

  console.log('[WS] WebSocket server initialized');
  return wss;
}

async function handleDeviceRegister(ws, msg) {
  const { deviceId } = msg;
  if (!deviceId) return;

  deviceConnections.set(deviceId, { ws, lastSeen: new Date() });
  console.log(`[WS] Device registered: ${deviceId}`);

  await updateDeviceStatus(deviceId, 'online');

  ws.send(JSON.stringify({ type: 'device:registered', deviceId }));

  broadcastToAdmins({
    type: 'device:status',
    deviceId,
    status: 'online',
    lastSeen: new Date().toISOString(),
  });
}

async function handleDeviceHeartbeat(ws, msg) {
  const { deviceId } = msg;
  if (!deviceId) return;

  const conn = deviceConnections.get(deviceId);
  if (conn) {
    conn.lastSeen = new Date();
    deviceConnections.set(deviceId, conn);
  }

  await updateDeviceStatus(deviceId, 'online');

  broadcastToAdmins({
    type: 'device:heartbeat',
    deviceId,
    lastSeen: new Date().toISOString(),
  });
}

function handleAdminSubscribe(ws) {
  adminClients.add(ws);
  console.log('[WS] Admin subscribed, total admins:', adminClients.size);

  // Send current online device list
  const onlineDevices = Array.from(deviceConnections.keys());
  ws.send(JSON.stringify({ type: 'admin:snapshot', onlineDevices }));
}

function broadcastToAdmins(payload) {
  const data = JSON.stringify(payload);
  for (const ws of adminClients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  }
}

/**
 * Push a command/content to a specific device
 */
function pushToDevice(deviceId, payload) {
  const conn = deviceConnections.get(deviceId);
  if (!conn || conn.ws.readyState !== WebSocket.OPEN) {
    return false;
  }
  conn.ws.send(JSON.stringify(payload));
  return true;
}

async function updateDeviceStatus(deviceId, status) {
  await supabase
    .from('devices')
    .update({ status, last_seen: new Date().toISOString() })
    .eq('id', deviceId);
}

module.exports = { initWebSocket, pushToDevice, broadcastToAdmins, deviceConnections };

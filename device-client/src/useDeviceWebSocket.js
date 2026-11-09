import { useEffect, useRef, useCallback, useState } from 'react'

const WS_SERVER = 'ws://localhost:3001'
const HEARTBEAT_INTERVAL = 15000   // 15s
const RECONNECT_DELAY_BASE = 2000  // 2s base, exponential backoff
const MAX_RECONNECT_DELAY = 30000  // 30s max

export function useDeviceWebSocket(deviceId, onCommand) {
  const ws = useRef(null)
  const heartbeatTimer = useRef(null)
  const reconnectTimer = useRef(null)
  const reconnectAttempt = useRef(0)
  const [status, setStatus] = useState('connecting') // connecting | connected | disconnected
  const onCommandRef = useRef(onCommand)
  onCommandRef.current = onCommand

  const stopHeartbeat = () => clearInterval(heartbeatTimer.current)

  const startHeartbeat = useCallback(() => {
    stopHeartbeat()
    heartbeatTimer.current = setInterval(() => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify({ type: 'device:heartbeat', deviceId }))
      }
    }, HEARTBEAT_INTERVAL)
  }, [deviceId])

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.CONNECTING) return

    console.log(`[Device WS] Connecting... attempt ${reconnectAttempt.current + 1}`)
    setStatus('connecting')
    ws.current = new WebSocket(WS_SERVER)

    ws.current.onopen = () => {
      console.log('[Device WS] Connected')
      setStatus('connected')
      reconnectAttempt.current = 0

      // Register this device
      ws.current.send(JSON.stringify({ type: 'device:register', deviceId }))
      startHeartbeat()
    }

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'command:show' || msg.type === 'command:playlist') {
          onCommandRef.current?.(msg)
        }
      } catch {/* ignore */}
    }

    ws.current.onclose = () => {
      console.log('[Device WS] Disconnected')
      setStatus('disconnected')
      stopHeartbeat()

      // Exponential backoff reconnect
      reconnectAttempt.current += 1
      const delay = Math.min(
        RECONNECT_DELAY_BASE * Math.pow(1.5, reconnectAttempt.current - 1),
        MAX_RECONNECT_DELAY
      )
      console.log(`[Device WS] Reconnecting in ${delay}ms...`)
      reconnectTimer.current = setTimeout(connect, delay)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [deviceId, startHeartbeat])

  useEffect(() => {
    if (!deviceId) return
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      clearInterval(heartbeatTimer.current)
      ws.current?.close()
    }
  }, [connect, deviceId])

  return { status }
}

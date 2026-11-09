import { useEffect, useRef, useCallback, useState } from 'react'

const WS_URL = `ws://${window.location.hostname}:3001`

export function useAdminWebSocket(onMessage) {
  const ws = useRef(null)
  const reconnectTimer = useRef(null)
  const [connected, setConnected] = useState(false)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return

    ws.current = new WebSocket(WS_URL)

    ws.current.onopen = () => {
      setConnected(true)
      console.log('[Admin WS] Connected')
      ws.current.send(JSON.stringify({ type: 'admin:subscribe' }))
    }

    ws.current.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        onMessageRef.current?.(msg)
      } catch {/* ignore */}
    }

    ws.current.onclose = () => {
      setConnected(false)
      console.log('[Admin WS] Disconnected, reconnecting in 3s...')
      reconnectTimer.current = setTimeout(connect, 3000)
    }

    ws.current.onerror = () => {
      ws.current?.close()
    }
  }, [])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      ws.current?.close()
    }
  }, [connect])

  return { connected }
}

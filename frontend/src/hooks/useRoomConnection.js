import { useEffect, useState } from 'react';
import { getAuthToken } from '../services/api';
import { roomCommand, roomPath, socketUrl } from '../lib/studyRoom';

export default function useRoomConnection(id, refresh) {
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    if (!id) return;
    let disposed = false;
    let socket;
    let retry;
    let readyTimeout;
    let attempt = 0;
    const token = getAuthToken();
    const active = () => !disposed && token === getAuthToken();

    function reconnect() {
      if (!active()) return;
      clearTimeout(retry);
      clearTimeout(readyTimeout);
      setConnected(false);
      refresh();
      retry = setTimeout(connect, Math.min(15000, 1000 * 2 ** Math.min(attempt++, 4)));
    }

    async function connect() {
      const result = await roomCommand(roomPath(id) + '/socket-ticket');
      if (!active()) return;
      if (!result.success) { reconnect(); return; }
      try { socket = new WebSocket(socketUrl()); }
      catch { reconnect(); return; }
      const current = socket;
      readyTimeout = setTimeout(() => current.close(), 8000);
      current.onopen = () => { if (active()) current.send(result.data); };
      current.onmessage = event => {
        if (!active()) return;
        if (event.data === 'ready') {
          clearTimeout(readyTimeout);
          attempt = 0;
          setConnected(true);
          refresh();
        } else if (event.data === 'changed') refresh();
      };
      current.onclose = reconnect;
      current.onerror = () => current.close();
    }

    const poll = setInterval(() => { if (active()) refresh(); }, 20000);
    const heartbeat = setInterval(() => {
      if (active() && socket?.readyState === WebSocket.OPEN) socket.send('ping');
    }, 25000);
    function regainFocus() { if (active() && !document.hidden) refresh(); }
    document.addEventListener('visibilitychange', regainFocus);
    connect();
    return () => {
      disposed = true;
      clearTimeout(retry);
      clearTimeout(readyTimeout);
      clearInterval(poll);
      clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', regainFocus);
      socket?.close();
    };
  }, [id, refresh]);
  return connected;
}

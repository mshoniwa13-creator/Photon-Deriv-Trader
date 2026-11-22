import { useEffect, useState } from 'react';

export type Candle = { epoch: number; open: number; high: number; low: number; close: number };
export type ConnectionState = 'connecting' | 'live' | 'disconnected' | 'error';
const endpoint = 'wss://api.derivws.com/trading/v1/options/ws/public';

export function usePublicMarket(symbol: string, granularity: number) {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [status, setStatus] = useState<ConnectionState>('connecting');
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let socket: WebSocket | undefined;
    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let firstDataTimer: ReturnType<typeof setTimeout> | undefined;
    setCandles([]);
    setStatus('connecting');
    try {
      socket = new WebSocket(endpoint);
      socket.onopen = () => {
        if (disposed) return;
        socket?.send(JSON.stringify({ ticks_history: symbol, count: 120, end: 'latest', style: 'candles', granularity, subscribe: 1 }));
        firstDataTimer = setTimeout(() => { if (!disposed) setStatus((current) => current === 'connecting' ? 'disconnected' : current); }, 12000);
      };
      socket.onmessage = (event) => {
        if (disposed) return;
        try {
          const message = JSON.parse(String(event.data));
          if (message.error) { setStatus('error'); return; }
          const rows = message?.candles ?? (message?.ohlc ? [message.ohlc] : []);
          if (Array.isArray(rows) && rows.length) {
            const mapped = rows.map((item: Record<string, unknown>) => ({
              epoch: Number(item.epoch), open: Number(item.open), high: Number(item.high),
              low: Number(item.low), close: Number(item.close),
            })).filter((c: Candle) => [c.epoch,c.open,c.high,c.low,c.close].every(Number.isFinite));
            if (mapped.length) {
              if (firstDataTimer) clearTimeout(firstDataTimer);
              setCandles((current) => {
                const merged = new Map(current.map((c) => [c.epoch, c]));
                mapped.forEach((c: Candle) => merged.set(c.epoch,c));
                return [...merged.values()].sort((a,b) => a.epoch-b.epoch).slice(-120);
              });
              setLastUpdate(Date.now());
              setStatus('live');
            }
          }
        } catch { setStatus('error'); }
      };
      socket.onerror = () => { if (!disposed) setStatus('error'); };
      socket.onclose = () => {
        if (!disposed) {
          setStatus((current) => current === 'error' ? current : 'disconnected');
          retryTimer = setTimeout(() => { if (!disposed) setAttempt((n) => n + 1); }, 5000);
        }
      };
    } catch { setStatus('error'); }
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (firstDataTimer) clearTimeout(firstDataTimer);
      socket?.close();
    };
  }, [symbol, granularity, attempt]);
  return { candles, status, lastUpdate, retry: () => setAttempt((n) => n + 1) };
}

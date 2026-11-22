import { useEffect, useState } from "react";

const endpoint = "wss://api.derivws.com/trading/v1/options/ws/public";

export type DerivSymbol = {
  symbol: string;
  name: string;
  pipSize: number;
  tradingSuspended: boolean;
};

export type SymbolFeedState =
  | "connecting"
  | "live"
  | "disconnected"
  | "error";

export function useDerivSymbols() {
  const [symbols, setSymbols] = useState<DerivSymbol[]>([]);
  const [status, setStatus] = useState<SymbolFeedState>("connecting");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let socket: WebSocket | undefined;
    let disposed = false;
    let completed = false;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;
    let responseTimer: ReturnType<typeof setTimeout> | undefined;

    setStatus("connecting");
    try {
      socket = new WebSocket(endpoint);
      socket.onopen = () => {
        if (disposed) return;
        socket?.send(JSON.stringify({ active_symbols: "brief", req_id: 1 }));
        responseTimer = setTimeout(() => {
          if (!disposed) {
            setStatus((current) =>
              current === "connecting" ? "disconnected" : current,
            );
          }
        }, 12000);
      };
      socket.onmessage = (event) => {
        if (disposed) return;
        try {
          const message = JSON.parse(String(event.data));
          if (message.error) {
            setStatus("error");
            return;
          }
          if (
            message.msg_type !== "active_symbols" ||
            !Array.isArray(message.active_symbols)
          ) {
            return;
          }

          const active = message.active_symbols
            .filter(
              (row: Record<string, unknown>) =>
                row.market === "synthetic_index" &&
                typeof row.underlying_symbol === "string" &&
                typeof row.underlying_symbol_name === "string",
            )
            .map((row: Record<string, unknown>) => ({
              symbol: String(row.underlying_symbol),
              name: String(row.underlying_symbol_name),
              pipSize: Number(row.pip_size),
              tradingSuspended: row.is_trading_suspended === 1,
            }))
            .sort((a: DerivSymbol, b: DerivSymbol) =>
              a.name.localeCompare(b.name),
            );

          if (!active.length) {
            setStatus("error");
            return;
          }
          if (responseTimer) clearTimeout(responseTimer);
          setSymbols(active);
          setStatus("live");
          completed = true;
          socket?.close();
        } catch {
          setStatus("error");
        }
      };
      socket.onerror = () => {
        if (!disposed) setStatus("error");
      };
      socket.onclose = () => {
        if (disposed || completed) return;
        setStatus((current) =>
          current === "error" ? current : "disconnected",
        );
        retryTimer = setTimeout(() => {
          if (!disposed) setAttempt((value) => value + 1);
        }, 5000);
      };
    } catch {
      setStatus("error");
    }

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      if (responseTimer) clearTimeout(responseTimer);
      socket?.close();
    };
  }, [attempt]);

  return {
    symbols,
    status,
    retry: () => setAttempt((value) => value + 1),
  };
}

"use client";

import { useState, useRef } from "react";

type EventOption = { id: string; name: string };

type ScanResult =
  | { type: "idle" }
  | { type: "loading" }
  | { type: "ok" }
  | { type: "conflict"; used_at: string }
  | { type: "notfound" }
  | { type: "error"; msg: string };

export default function ScannerClient({ events }: { events: EventOption[] }) {
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ScanResult>({ type: "idle" });
  const inputRef = useRef<HTMLInputElement>(null);

  async function verify(raw: string) {
    const t = raw.trim();
    if (!t) return;
    setResult({ type: "loading" });
    try {
      const res = await fetch(`/api/check/${encodeURIComponent(t)}`, { method: "POST" });
      if (res.ok) {
        setResult({ type: "ok" });
      } else if (res.status === 409) {
        const data = await res.json().catch(() => ({}));
        setResult({ type: "conflict", used_at: data.used_at ?? "" });
      } else if (res.status === 404) {
        setResult({ type: "notfound" });
      } else {
        const data = await res.json().catch(() => ({}));
        setResult({ type: "error", msg: data.error ?? `Error ${res.status}` });
      }
    } catch {
      setResult({ type: "error", msg: "Error de red — verificá la conexión." });
    }
  }

  function reset() {
    setToken("");
    setResult({ type: "idle" });
    setTimeout(() => inputRef.current?.focus(), 60);
  }

  const busy = result.type === "loading";

  if (events.length === 0) {
    return (
      <div style={cardStyle}>
        <p style={{ color: "var(--muted)", textAlign: "center" }}>
          No hay eventos registrados. Creá un evento primero.
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", display: "flex", flexDirection: "column", gap: "1rem" }}>

      {/* Resultado */}
      {result.type === "ok" && (
        <ResultCard
          bg="#f0fdf4" border="#86efac" color="#166534"
          icon="✓" title="Entrada válida"
          body="Acceso permitido. Entrada marcada como usada."
          onReset={reset}
        />
      )}
      {result.type === "conflict" && (
        <ResultCard
          bg="#fefce8" border="#fde047" color="#854d0e"
          icon="⚠" title="Entrada ya utilizada"
          body={`Usada el ${new Date(result.used_at).toLocaleString("es-AR")}`}
          onReset={reset}
        />
      )}
      {result.type === "notfound" && (
        <ResultCard
          bg="#fef2f2" border="#fca5a5" color="#991b1b"
          icon="✗" title="Entrada no encontrada"
          body="El QR no corresponde a ninguna entrada registrada."
          onReset={reset}
        />
      )}
      {result.type === "error" && (
        <ResultCard
          bg="#fef2f2" border="#fca5a5" color="#991b1b"
          icon="✗" title="Error"
          body={result.msg}
          onReset={reset}
        />
      )}

      {/* Input — solo si aún no hay resultado definitivo */}
      {(result.type === "idle" || result.type === "loading") && (
        <div style={cardStyle}>
          <label style={labelStyle}>Token QR</label>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              ref={inputRef}
              type="text"
              value={token}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              disabled={busy}
              placeholder="Escaneá o pegá el token"
              onChange={e => setToken(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") verify(token); }}
              style={{
                flex: 1,
                padding: "0.625rem 0.75rem",
                borderRadius: 6,
                border: "1px solid var(--border)",
                background: "var(--bg)",
                color: "var(--text)",
                fontSize: "0.85rem",
                fontFamily: "monospace",
                opacity: busy ? 0.6 : 1,
              }}
            />
            <button
              onClick={() => verify(token)}
              disabled={busy || !token.trim()}
              style={{
                padding: "0.625rem 1.1rem",
                borderRadius: 6,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.875rem",
                cursor: busy || !token.trim() ? "not-allowed" : "pointer",
                opacity: busy || !token.trim() ? 0.55 : 1,
                whiteSpace: "nowrap",
              }}
            >
              {busy ? "…" : "Verificar"}
            </button>
          </div>
          <p style={{ fontSize: "0.75rem", color: "var(--muted)" }}>
            Conectá una pistola de QR (actúa como teclado) o pegá el token manualmente.
            Presioná Enter para verificar.
          </p>
        </div>
      )}

      {/* Lista de eventos como referencia */}
      {events.length > 1 && result.type === "idle" && (
        <details style={{ fontSize: "0.8rem", color: "var(--muted)" }}>
          <summary style={{ cursor: "pointer", userSelect: "none" }}>
            Eventos disponibles ({events.length})
          </summary>
          <ul style={{ marginTop: "0.5rem", paddingLeft: "1.25rem" }}>
            {events.map(ev => <li key={ev.id}>{ev.name}</li>)}
          </ul>
        </details>
      )}
    </div>
  );
}

function ResultCard({
  bg, border, color, icon, title, body, onReset,
}: {
  bg: string; border: string; color: string;
  icon: string; title: string; body: string;
  onReset: () => void;
}) {
  return (
    <div style={{
      background: bg,
      border: `2px solid ${border}`,
      borderRadius: 10,
      padding: "2rem 1.5rem",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "3.5rem", lineHeight: 1, marginBottom: "0.5rem" }}>{icon}</div>
      <div style={{ fontSize: "1.25rem", fontWeight: 700, color, marginBottom: "0.4rem" }}>{title}</div>
      <p style={{ color, fontSize: "0.875rem", marginBottom: "1.25rem" }}>{body}</p>
      <button
        onClick={onReset}
        style={{
          padding: "0.5rem 1.5rem",
          borderRadius: 6,
          border: `1.5px solid ${border}`,
          background: "transparent",
          color,
          fontWeight: 600,
          fontSize: "0.875rem",
          cursor: "pointer",
        }}
      >
        Escanear otra entrada
      </button>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "1.25rem",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.8rem",
  fontWeight: 600,
  color: "var(--muted)",
  marginBottom: "0.4rem",
};

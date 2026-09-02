"use client";

import { useState } from "react";

interface Props {
  token: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  alreadyUsed: boolean;
  usedAt: string | null;
}

export default function CheckClient({ token, firstName, lastName, email, alreadyUsed, usedAt }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "done" | "error" | "conflict">(
    alreadyUsed ? "conflict" : "idle"
  );
  const [conflictTime, setConflictTime] = useState<string | null>(usedAt);

  const name = [firstName, lastName].filter(Boolean).join(" ") || "Sin nombre";

  async function markUsed() {
    setState("loading");
    try {
      const res = await fetch(`/api/check/${token}`, { method: "POST" });
      if (res.ok) {
        setState("done");
      } else if (res.status === 409) {
        const data = await res.json();
        setConflictTime(data.used_at ? new Date(data.used_at).toLocaleString("es-AR") : null);
        setState("conflict");
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  const bg = state === "done" ? "#dcfce7" : state === "conflict" ? "#fef9c3" : "var(--surface)";

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", background: "var(--bg)" }}>
      <div style={{ background: bg, border: "1px solid var(--border)", borderRadius: 12, padding: "2rem", maxWidth: 380, width: "100%", textAlign: "center", transition: "background 0.3s" }}>

        {state === "idle" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎟️</div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.25rem" }}>{name}</h1>
            {email && <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginBottom: "1.5rem" }}>{email}</p>}
            <p style={{ color: "var(--green)", fontWeight: 600, marginBottom: "1.5rem" }}>✓ Entrada válida</p>
            <button
              onClick={markUsed}
              style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: 600, cursor: "pointer", width: "100%" }}
            >
              Marcar como usada
            </button>
          </>
        )}

        {state === "loading" && (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>⏳</div>
            <p>Registrando entrada...</p>
          </>
        )}

        {state === "done" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, marginBottom: "0.5rem" }}>¡Entrada registrada!</h1>
            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{name}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.875rem" }}>Puede pasar.</p>
          </>
        )}

        {state === "conflict" && (
          <>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>⚠️</div>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700, color: "var(--red)", marginBottom: "0.5rem" }}>Entrada ya utilizada</h1>
            <p style={{ fontWeight: 600, marginBottom: "0.25rem" }}>{name}</p>
            {conflictTime && (
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>Usada el {conflictTime}</p>
            )}
          </>
        )}

        {state === "error" && (
          <>
            <div style={{ fontSize: "2rem", marginBottom: "1rem" }}>❌</div>
            <p style={{ color: "var(--red)", fontWeight: 600 }}>Error al registrar</p>
            <button
              onClick={() => setState("idle")}
              style={{ marginTop: "1rem", background: "none", border: "1px solid var(--border)", borderRadius: 8, padding: "0.5rem 1.5rem", cursor: "pointer" }}
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

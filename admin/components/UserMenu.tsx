"use client";

import { useState, useRef, useEffect } from "react";

interface Props {
  name: string | null;
  email: string;
  picture: string | null;
  logoutUrl: string;
}

export default function UserMenu({ name, email, picture, logoutUrl }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          background: "none",
          border: "1px solid var(--border)",
          borderRadius: 999,
          padding: "0.375rem 0.75rem 0.375rem 0.375rem",
          cursor: "pointer",
          fontSize: "0.875rem",
          color: "var(--text)",
        }}
      >
        {picture ? (
          <img src={picture} alt="" width={28} height={28} style={{ borderRadius: "50%", display: "block" }} />
        ) : (
          <span style={{
            width: 28, height: 28, borderRadius: "50%",
            background: "var(--accent)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.75rem", fontWeight: 700,
          }}>
            {(name ?? email).charAt(0).toUpperCase()}
          </span>
        )}
        <span>{name ?? email}</span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: "var(--muted)", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: "absolute",
          right: 0,
          top: "calc(100% + 0.5rem)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
          minWidth: 200,
          zIndex: 50,
          overflow: "hidden",
        }}>
          <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid var(--border)" }}>
            <p style={{ fontWeight: 600, fontSize: "0.875rem" }}>{name ?? "—"}</p>
            <p style={{ color: "var(--muted)", fontSize: "0.75rem", marginTop: 2 }}>{email}</p>
          </div>
          <a
            href={logoutUrl}
            style={{
              display: "block",
              padding: "0.625rem 1rem",
              fontSize: "0.875rem",
              color: "var(--red)",
              textDecoration: "none",
            }}
          >
            Cerrar sesión
          </a>
        </div>
      )}
    </div>
  );
}

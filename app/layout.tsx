import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gran Fiesta de la Primavera 2026",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

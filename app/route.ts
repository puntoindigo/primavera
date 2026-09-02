import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  const filePath = path.join(process.cwd(), "public", "landing.html");
  const html = await readFile(filePath, "utf-8");
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

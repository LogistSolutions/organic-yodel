import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

const CONFIG_PATH = path.join(process.cwd(), "app/data/config.json");

// GET: aktuelle Config zurückgeben
export async function GET() {
  try {
    const data = await fs.readFile(CONFIG_PATH, "utf-8");
    return NextResponse.json(JSON.parse(data));
  } catch (e) {
    return NextResponse.json({ error: "Config nicht gefunden." }, { status: 404 });
  }
}

// POST: neue Config speichern
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await fs.writeFile(CONFIG_PATH, JSON.stringify(body, null, 2), "utf-8");
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Fehler beim Speichern: " + e.message }, { status: 500 });
  }
}

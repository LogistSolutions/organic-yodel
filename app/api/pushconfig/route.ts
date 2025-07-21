import { NextRequest, NextResponse } from "next/server";

// Hole alle nötigen Secrets aus der Umgebung
const TOKEN = process.env.GITHUB_TOKEN!;
const REPO = process.env.GITHUB_REPO!;
const BRANCH = process.env.GITHUB_BRANCH || "codespace-organic-yodel-v654xpww5qj6cx55w";
const CONFIG_PATH = process.env.GITHUB_CONFIG_PATH || "app/data/config.json";
const COMMITTER_NAME = process.env.GITHUB_COMMITTER_NAME || "Admin";
const COMMITTER_EMAIL = process.env.GITHUB_COMMITTER_EMAIL || "admin@example.com";

// SHA der aktuellen Datei holen (für Update)
async function getFileSha() {
  const url = `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Accept": "application/vnd.github+json" },
    cache: "no-store"
  });
  if (!res.ok) throw new Error("Konnte SHA nicht abrufen");
  const data = await res.json();
  return data.sha;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = Buffer.from(JSON.stringify(body, null, 2)).toString("base64");
    const sha = await getFileSha();

    // Commit anlegen
    const url = `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json",
      },
      body: JSON.stringify({
        message: "Konfiguration über Admin geändert",
        content,
        branch: BRANCH,
        committer: {
          name: COMMITTER_NAME,
          email: COMMITTER_EMAIL
        },
        sha
      }),
      cache: "no-store"
    });

    if (!res.ok) {
      const error = await res.json();
      return NextResponse.json({ error: error.message || "Fehler beim Commit" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

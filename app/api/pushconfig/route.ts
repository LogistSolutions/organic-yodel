import { NextRequest, NextResponse } from "next/server";

// HART KODIERTE VARIABLEN – passe an deine Daten an!
const TOKEN = "DEIN_GITHUB_TOKEN_HIER"; // <-- Trage deinen Token ein!
const REPO = "LogistSolutions/organic-yodel";
const BRANCH = "codespace-organic-yodel-v654xpww5qj6cx55w";
const CONFIG_PATH = "app/data/config.json";
const COMMITTER_NAME = "KalkulatorAdmin";
const COMMITTER_EMAIL = "admin@logist.de";
// SHA der aktuellen Datei holen (für Update)
async function getFileSha() {
  const url = `https://api.github.com/repos/${REPO}/contents/${CONFIG_PATH}?ref=${BRANCH}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${TOKEN}`, "Accept": "application/vnd.github+json" },
    cache: "no-store"
  });
  if (!res.ok) {
    const text = await res.text();
    // Antwort auch zurückgeben!
    throw new Error(`Konnte SHA nicht abrufen. Status: ${res.status} – ${text}`);
  }
  const data = await res.json();
  return data.sha;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const content = Buffer.from(JSON.stringify(body, null, 2)).toString("base64");
    let sha = null;

    try {
      sha = await getFileSha();
    } catch (e: any) {
      // SHA-Fehler explizit weitergeben!
      return NextResponse.json({ error: e.message }, { status: 500 });
    }

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

    const result = await res.json();

    if (!res.ok) {
      // Fehler der GitHub-API ausführlich an den Client geben!
      return NextResponse.json(
        { error: `Commit fehlgeschlagen: ${result.message || JSON.stringify(result)}` },
        { status: 500 }
      );
    }

    // Erfolg: Commit-Infos zeigen!
    return NextResponse.json({
      success: true,
      commit: {
        message: result.commit?.message,
        sha: result.commit?.sha,
        url: result.commit?.html_url,
      }
    });

  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
"use client";
import { useState } from "react";

// Passwort hart codiert
const ADMIN_PASSWORD = "ManuelistderbesteLarskannsowasnicht";

function pretty(obj: object) {
  return JSON.stringify(obj, null, 2);
}

export default function AdminPage() {
  const [inputPassword, setInputPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [config, setConfig] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [editMode, setEditMode] = useState<string | false>(false);
  const [editFields, setEditFields] = useState<any>({});
  const [commitLoading, setCommitLoading] = useState(false);

  // Config laden
  async function loadConfig() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/config", { cache: "no-store" });
      if (!res.ok) throw new Error("Config nicht gefunden.");
      const data = await res.json();
      setConfig(pretty(data));
      setMessage("");
    } catch (e: any) {
      setMessage("Fehler beim Laden der Config: " + e.message);
    }
    setIsLoading(false);
  }

  // Admin-Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputPassword === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      await loadConfig();
    } else {
      setMessage("Falsches Passwort!");
    }
  };

  // Kunde speichern (lokal, nicht zu GitHub)
  const handleEditSave = async () => {
    try {
      const configObj = JSON.parse(config ?? "");
      configObj.kunden[editMode as string] = { ...editFields };
      // Lokal speichern (optional, wenn du die /api/config API nutzt, sonst kann diese Funktion leer sein)
      const res = await fetch("/api/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configObj),
      });
      if (!res.ok) {
        setMessage("Fehler beim lokalen Speichern!");
      } else {
        setConfig(JSON.stringify(configObj, null, 2));
        setMessage("Lokal gespeichert. Noch nicht zu GitHub übertragen!");
        setEditMode(false);
      }
    } catch (e: any) {
      setMessage("Fehler: " + e.message);
    }
  };

  // Zu GitHub committen
  const handleEditCommit = async () => {
    setCommitLoading(true);
    try {
      const configObj = JSON.parse(config ?? "");
      configObj.kunden[editMode as string] = { ...editFields };
      const res = await fetch("/api/pushconfig", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(configObj),
      });
      if (!res.ok) {
        const error = await res.json();
        setMessage("Fehler beim GitHub-Commit: " + (error?.error || ""));
      } else {
        setConfig(JSON.stringify(configObj, null, 2));
        setMessage("Erfolgreich zu GitHub übertragen! Die Seite wird in Kürze automatisch neu gebaut.");
        setEditMode(false);
      }
    } catch (e: any) {
      setMessage("Fehler: " + e.message);
    }
    setCommitLoading(false);
  };

  if (!isAuthenticated) {
    return (
      <div className="main-container" style={{ maxWidth: 420 }}>
        <h1>Admin Login</h1>
        <form onSubmit={handleLogin}>
          <label style={{ fontWeight: 600, color: "#e74027" }}>
            Passwort
          </label>
          <input
            type="password"
            className="input-modern"
            placeholder="Admin Passwort"
            value={inputPassword}
            onChange={e => {
              setInputPassword(e.target.value);
              setMessage("");
            }}
            style={{ width: "100%", marginTop: 12, marginBottom: 12 }}
          />
          <button type="submit" className="cta-btn" style={{ marginTop: 8 }}>
            Einloggen
          </button>
          {message && <div style={{ color: "#e74027", marginTop: 10 }}>{message}</div>}
        </form>
      </div>
    );
  }

  // Tabellenansicht
  if (config && !editMode) {
    const kundenObj = JSON.parse(config).kunden;
    return (
      <div className="main-container" style={{ maxWidth: 900 }}>
        <h1>Adminbereich</h1>
        <p style={{ color: "#232323", fontWeight: 600, marginBottom: 18 }}>
          Alle Kunden-Konfigurationen:
        </p>
        {message && <div style={{ color: "#e74027", margin: "0 0 16px 0" }}>{message}</div>}
        {isLoading && <div style={{ color: "#e74027", margin: "0 0 16px 0" }}>Lade Daten ...</div>}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 24 }}>
          <thead>
            <tr style={{ background: "#fafafa" }}>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1.5px solid #ededed" }}>Kundennummer</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1.5px solid #ededed" }}>Labels (Auszug)</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1.5px solid #ededed" }}>Paletten-Einheiten</th>
              <th style={{ textAlign: "left", padding: 8, borderBottom: "1.5px solid #ededed" }}>Aktionen</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(kundenObj).map(([kundennr, kunde]: any) => (
              <tr key={kundennr} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 8, fontWeight: 600, color: "#e74027" }}>{kundennr}</td>
                <td style={{ padding: 8, color: "#232323" }}>
                  {kunde.labels?.slice(0,2).join(", ")}{kunde.labels.length > 2 ? "..." : ""}
                </td>
                <td style={{ padding: 8, color: "#222" }}>{kunde.palletUnits?.join(", ")}</td>
                <td style={{ padding: 8 }}>
                  <button
                    className="cta-btn"
                    style={{ fontSize: 13, padding: "7px 16px", marginRight: 7 }}
                    onClick={() => {
                      setEditMode(kundennr);
                      setMessage("");
                      setEditFields({ ...kunde });
                    }}
                    type="button"
                  >
                    Bearbeiten
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          className="cta-btn"
          style={{ background: "#888", color: "#fff", marginTop: 0 }}
          onClick={loadConfig}
          type="button"
        >
          Neu laden
        </button>
      </div>
    );
  }

  // Einzelkunden-Bearbeitung (Formular)
  if (config && editMode) {
    return (
      <div className="main-container" style={{ maxWidth: 700 }}>
        <h2 style={{ fontSize: 21, color: "#e74027", marginTop: 0 }}>
          Kunde <span style={{ fontWeight: 900 }}>{editMode}</span> bearbeiten
        </h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            // Standardmäßig speichern wir erstmal lokal.
            handleEditSave();
          }}
        >
          <label style={{ fontWeight: 600, marginBottom: 6 }}>Labels (Kommagetrennt)</label>
          <input
            type="text"
            value={editFields.labels?.join(", ") ?? ""}
            onChange={e =>
              setEditFields((f: any) => ({
                ...f,
                labels: e.target.value.split(",").map((l: string) => l.trim()),
              }))
            }
            style={{
              width: "100%",
              marginBottom: 14,
              padding: 8,
              borderRadius: 6,
              border: "1.2px solid #ededed"
            }}
          />
          <label style={{ fontWeight: 600, marginBottom: 6 }}>Paletten-Einheiten (Kommagetrennt)</label>
          <input
            type="text"
            value={editFields.palletUnits?.join(", ") ?? ""}
            onChange={e =>
              setEditFields((f: any) => ({
                ...f,
                palletUnits: e.target.value
                  .split(",")
                  .map((n: string) => Number(n.trim()))
                  .filter((n: number) => !isNaN(n)),
              }))
            }
            style={{
              width: "100%",
              marginBottom: 14,
              padding: 8,
              borderRadius: 6,
              border: "1.2px solid #ededed"
            }}
          />
          <label style={{ fontWeight: 600, marginBottom: 6 }}>Verpackungsmaterial (Kommagetrennt)</label>
          <input
            type="text"
            value={editFields.packagingMaterial?.join(", ") ?? ""}
            onChange={e =>
              setEditFields((f: any) => ({
                ...f,
                packagingMaterial: e.target.value
                  .split(",")
                  .map((n: string) => Number(n.trim()))
                  .filter((n: number) => !isNaN(n)),
              }))
            }
            style={{
              width: "100%",
              marginBottom: 14,
              padding: 8,
              borderRadius: 6,
              border: "1.2px solid #ededed"
            }}
          />
          <label style={{ fontWeight: 600, marginBottom: 6 }}>Verpackungszeit (Kommagetrennt)</label>
          <input
            type="text"
            value={editFields.packagingTime?.join(", ") ?? ""}
            onChange={e =>
              setEditFields((f: any) => ({
                ...f,
                packagingTime: e.target.value
                  .split(",")
                  .map((n: string) => Number(n.trim()))
                  .filter((n: number) => !isNaN(n)),
              }))
            }
            style={{
              width: "100%",
              marginBottom: 14,
              padding: 8,
              borderRadius: 6,
              border: "1.2px solid #ededed"
            }}
          />
          <label style={{ fontWeight: 600, marginBottom: 6 }}>kmRateTable (Kommagetrennte Werte pro Zeile; z.B. 1.2,1.4,1.6,1.75,2,2.2)</label>
          <textarea
            value={
              editFields.preise?.kmRateTable
                ? editFields.preise.kmRateTable.map((row: any) => row.join(",")).join("\n")
                : ""
            }
            onChange={e => {
              const rows = e.target.value
                .split("\n")
                .map(row =>
                  row
                    .split(",")
                    .map(v => Number(v.trim()))
                    .filter(n => !isNaN(n))
                )
                .filter(r => r.length > 0);
              setEditFields((f: any) => ({
                ...f,
                preise: { ...f.preise, kmRateTable: rows },
              }));
            }}
            style={{
              width: "100%",
              minHeight: 80,
              fontFamily: "monospace",
              fontSize: 14,
              background: "#f4f3f3",
              borderRadius: 8,
              border: "1.2px solid #ededed",
              padding: 10,
              marginBottom: 16
            }}
          />
          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button className="cta-btn" style={{ flex: 1 }} type="submit">
              Speichern (lokal)
            </button>
            <button
              className="cta-btn"
              style={{
                flex: 1,
                background: "#2663eb",
                color: "#fff",
                fontWeight: 600
              }}
              type="button"
              onClick={handleEditCommit}
              disabled={commitLoading}
            >
              {commitLoading ? "Commit zu GitHub ..." : "Jetzt zu GitHub committen"}
            </button>
            <button
              className="cta-btn"
              style={{
                flex: 1,
                background: "#aaa",
                color: "#fff",
                fontWeight: 600
              }}
              type="button"
              onClick={() => setEditMode(false)}
            >
              Abbrechen
            </button>
          </div>
          <div style={{ fontSize: 13, marginTop: 10, color: "#222" }}>
            <span>
              <b>Hinweis:</b> Nur mit „Jetzt zu GitHub committen“ wird die Änderung wirklich dauerhaft in dein Repository übertragen und auf der Seite veröffentlicht!
            </span>
          </div>
          {message && <div style={{ color: "#e74027", marginTop: 10 }}>{message}</div>}
        </form>
      </div>
    );
  }

  // Fallback
  return (
    <div className="main-container" style={{ maxWidth: 420 }}>
      <h1>Adminbereich</h1>
      <p>Keine Daten geladen.</p>
      <button className="cta-btn" onClick={loadConfig}>Neu laden</button>
    </div>
  );
}

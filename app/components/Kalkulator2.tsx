"use client";
import React, { useState } from "react";

// Typen
type Adresse = {
  firmenname?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
};
type Staffel = { von: number; bis: number; preis: number; art: string; label?: string };
type KundeConfig = {
  labels?: string[];
  staffeln?: Staffel[][];
  rechnung?: Adresse;
  abholadresse?: Adresse;
};
type Props = { config: KundeConfig; kundennummer: string };

// Einstellungen
const MAX_ROWS = 6;
const MAX_MENGE = 700;

// ===== PDF-Download-Button =====
function PdfDownloadButton({ getPdfHtml }: { getPdfHtml: () => string }) {
  const [loading, setLoading] = useState(false);
  const handleDownload = async () => {
    setLoading(true);
    const html = getPdfHtml();
    const res = await fetch("/api/html-to-pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ html }),
    });
    if (!res.ok) {
      const err = await res.json();
      alert("Fehler beim PDF-Export: " + (err.error || "unbekannt"));
      setLoading(false);
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Stueckpreis_Kalkulation.pdf";
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  };
  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={loading}
      style={{
        background: "#1188b8",
        color: "#fff",
        border: "none",
        borderRadius: 7,
        padding: "0.6em 1.4em",
        fontSize: "1.09em",
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
        marginTop: "1em",
        width: 200,
        minWidth: 200,
        textDecoration: "none",
        display: "inline-block",
        textAlign: "center",
      }}
    >
      {loading ? "PDF wird erstellt..." : "PDF herunterladen"}
    </button>
  );
}

export default function StueckpreisKalkulator({ config, kundennummer }: Props) {
  // Staffeln und Labels robust auslesen
  const rawStaffeln = Array.isArray(config?.staffeln) ? config.staffeln : [];
  const staffeln: Staffel[][] = Array.from({ length: MAX_ROWS }).map(
    (_, i) => Array.isArray(rawStaffeln[i]) ? rawStaffeln[i] : []
  );
  const labels: string[] = Array.from({ length: MAX_ROWS }).map((_, i) =>
    (config?.labels && typeof config.labels[i] === "string" && config.labels[i]?.trim())
      ? config.labels[i]!
      : staffeln[i][0]?.label
        ? staffeln[i][0]?.label!
        : `Kategorie ${i + 1}`
  );

  // States
  const [quantities, setQuantities] = useState<(number | "")[]>(Array(MAX_ROWS).fill(""));
  const [reference, setReference] = useState("");
  const [bemerkungen, setBemerkungen] = useState("");
  const [warnung, setWarnung] = useState(false);

  // Rechnungsadresse
  const [rechnungsadresse] = useState<Adresse>({
    firmenname: config?.rechnung?.firmenname || "",
    strasse: config?.rechnung?.strasse || "",
    plz: config?.rechnung?.plz || "",
    ort: config?.rechnung?.ort || "",
    land: config?.rechnung?.land || "",
  });

  // Abholadresse
  const [abholadresse, setAbholadresse] = useState<Adresse>({
    firmenname: config?.abholadresse?.firmenname || "",
    strasse: config?.abholadresse?.strasse || "",
    plz: config?.abholadresse?.plz || "",
    ort: config?.abholadresse?.ort || "",
    land: config?.abholadresse?.land || "",
  });

  // Eingabe-Handler (begrenzt auf 0...MAX_MENGE)
  function handleMengeChange(idx: number, value: string) {
    let menge = value === "" ? "" : Math.max(0, Math.min(MAX_MENGE, Number(value.replace(/[^0-9]/g, ""))));
    setQuantities(q => {
      const updated = [...q];
      updated[idx] = menge === "" ? "" : Number(menge);
      return updated;
    });
  }

  // Summieren der Mengen, Limit und Warnung
const totalMenge = quantities.reduce(
  (sum: number, q) => sum + (typeof q === "number" ? q : 0),
  0
);

  React.useEffect(() => {
    setWarnung(totalMenge > MAX_MENGE);
  }, [totalMenge]);

  // --- Staffelinfos je Kategorie (immer nach Gesamtmenge suchen!) ---
  const staffelInfos = labels.map((_, idx) => {
    const menge = quantities[idx];
    if (!menge || typeof menge !== "number" || menge === 0) return null;
    const staffel = staffeln[idx];
    const s = staffel.find(st => totalMenge >= st.von && totalMenge <= st.bis);
    return s || null;
  });

  // --- Korrekte Kalkulation: Nur höchste Pauschale, Rest wie Stückpreis ---
  let maxPauschale = 0;
  let pauschaleIdx = -1;
  let hasPauschale = false;
  const einzelGesamt: number[] = labels.map((_, idx) => {
    const menge = quantities[idx];
    if (!menge || typeof menge !== "number" || menge === 0) return 0;
    const s = staffelInfos[idx];
    if (!s) return 0;
    if (s.art === "Pauschale") {
      if (s.preis > maxPauschale) {
        maxPauschale = s.preis;
        pauschaleIdx = idx;
      }
      hasPauschale = true;
      return 0; // Zunächst keine Pauschale addieren, das machen wir unten gesammelt
    }
    return menge * s.preis;
  });

  // Jetzt die teuerste Pauschale addieren (falls vorhanden)
  const gesamt = einzelGesamt.reduce((sum, val) => sum + val, 0) + (hasPauschale ? maxPauschale : 0);

  // Durchschnittlicher Stückpreis
  const avgStueckpreis = totalMenge > 0 ? gesamt / totalMenge : 0;

  // Info: Wurde Pauschale verwendet?
  const infoText = hasPauschale
    ? "Es handelt sich um einen Pauschalbetrag (nur die teuerste belegte Pauschale wird angewandt; andere Kategorien werden ggf. als Stückpreis gerechnet)."
    : "Es handelt sich um eine Staffelberechnung (alle belegten Kategorien im Stückpreisbereich).";

  // Spaltenbreiten für ASCII-Mail
  const col1 = 71, col2 = 6, col3 = 18, col4 = 10;
  const header =
    "Position".padEnd(col1) + " | " +
    "Menge".padStart(col2) + " | " +
    "Staffelpreis".padStart(col3) + " | " +
    "Gesamt".padStart(col4);
  const trenner = "".padEnd(header.length, "-");
  const asciiRows = labels.map((label, idx) => {
    const menge = (quantities[idx] !== "" && quantities[idx] !== undefined) ? String(quantities[idx]) : "";
    const s = staffelInfos[idx];
    let preisStr = "";
    if (s) preisStr = (s.art === "Pauschale" ? "Pauschale " : "Stückpreis ") + s.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + "€";
    let summe = "";
    if (hasPauschale && idx === pauschaleIdx) {
      summe = maxPauschale.toLocaleString("de-DE", { minimumFractionDigits: 2 });
    } else if (s && s.art !== "Pauschale" && typeof quantities[idx] === "number") {
      summe = (quantities[idx] as number * s.preis).toLocaleString("de-DE", { minimumFractionDigits: 2 });
    } else {
      summe = "0,00";
    }
    return (
      (label || "-").padEnd(col1) + " | " +
      menge.padStart(col2) + " | " +
      preisStr.padStart(col3) + " | " +
      summe.padStart(col4)
    );
  }).join("\n");

  // Mailto-Link generieren (mit korrektem return!)
  const mailTo = (() => {
    const empfaenger = "dispo@logist.de";
    const subject = `Stückpreis-Kalkulation – ${rechnungsadresse.firmenname}${reference ? " – " + reference : ""}`;
    const bodyLines = [
      `Kundennummer: ${kundennummer}`,
      `Kunde: ${rechnungsadresse.firmenname}`,
      `Referenz: ${reference}`,
      "",
      "Stückpreis-Kalkulation:",
      trenner,
      header,
      trenner,
      asciiRows,
      trenner,
      `Gesamtmenge: ${totalMenge}`,
      `Gesamtsumme netto: ${gesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €`,
      `Durchschnittlicher Stückpreis: ${totalMenge > 0 ? avgStueckpreis.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €" : "–"}`,
      "",
      infoText,
      "",
      `Rechnungsadresse: ${rechnungsadresse.firmenname}, ${rechnungsadresse.strasse}, ${rechnungsadresse.plz} ${rechnungsadresse.ort}, ${rechnungsadresse.land}`,
      "",
      `Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}`,
      "",
      `Bemerkungen: ${bemerkungen.trim() ? bemerkungen.trim() : "Keine"}`
    ];
    const mailBody = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:${empfaenger}?subject=${encodeURIComponent(subject)}&body=${mailBody}`;
  })();

  // PDF HTML-Generator (zeigt Gesamtsumme und Einzelzeilen + Staffelpreise!)
  const getPdfHtml = () => {
    const rowsHtml = labels.map((label, idx) => {
      const menge = quantities[idx] || "";
      const s = staffelInfos[idx];
      const preisStr = s ? (s.art === "Pauschale" ? "Pauschale " : "Stückpreis ") + s.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €" : "-";
      let summe = "0,00";
      if (hasPauschale && idx === pauschaleIdx) {
        summe = maxPauschale.toLocaleString("de-DE", { minimumFractionDigits: 2 });
      } else if (s && s.art !== "Pauschale" && typeof quantities[idx] === "number") {
        summe = (quantities[idx] as number * s.preis).toLocaleString("de-DE", { minimumFractionDigits: 2 });
      }
      return `<tr>
        <td>${label || "-"}</td>
        <td style="text-align:right">${menge}</td>
        <td style="text-align:right">${preisStr}</td>
        <td style="text-align:right">${summe}</td>
      </tr>`;
    }).join("");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Stückpreis-Kalkulation</title>
        <style>
          body { font-family: Arial,sans-serif; font-size: 12px; margin: 22px; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid #e1e1e1; padding: 6px; font-size: 10px;}
          th { background: #e6f1fb; }
        </style>
      </head>
      <body>
        <h2>Stückpreis-Kalkulator – ${rechnungsadresse.firmenname}${reference ? " – " + reference : ""}</h2>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Anzahl</th>
              <th>Staffelpreis</th>
              <th>Gesamt (€)</th>
            </tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot>
            <tr>
              <td style="text-align:right;font-weight:700;">Summe:</td>
              <td style="font-weight:700;">${totalMenge}</td>
              <td></td>
              <td style="font-weight:700;">${gesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €</td>
            </tr>
          </tfoot>
        </table>
        <div style="margin:10px 0"><b>Durchschnittlicher Stückpreis: ${
          totalMenge > 0 ? avgStueckpreis.toLocaleString("de-DE", { minimumFractionDigits: 3 }) + " €" : "–"
        }</b></div>
        <div style="margin:6px 0 16px 0;">
        <b>${infoText}</b>
        </div>
        <hr/>
        <div>Rechnungsadresse: ${rechnungsadresse.firmenname}, ${rechnungsadresse.strasse}, ${rechnungsadresse.plz} ${rechnungsadresse.ort}, ${rechnungsadresse.land}</div>
        <div>Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}</div>
        <div style="margin-top:10px"><b>Bemerkungen:</b><br/>${bemerkungen.trim() ? bemerkungen.trim().replace(/\n/g, "<br/>") : "Keine"}</div>
      </body>
      </html>
    `;
  };

  // ------- UI
  return (
    <div style={{
      background: "#fff",
      borderRadius: 22,
      boxShadow: "0 6px 32px #b9cbe40c",
      maxWidth: 570,
      margin: "32px auto",
      padding: "30px 28px"
    }}>
      <h2 style={{
        textAlign: "center", color: "#1188b8", marginBottom: 7, fontWeight: 900,
        fontSize: "1.7rem", letterSpacing: 0.5
      }}>
        Stückpreis-Kalkulator
      </h2>
      <div style={{ textAlign: "center", color: "#888", marginBottom: 18, fontWeight: 700 }}>
        Kundennummer: <span style={{ color: "#456" }}>{kundennummer}</span>
      </div>
      <table style={{
        width: "100%", borderCollapse: "collapse", fontSize: "0.85em", marginBottom: 8
      }}>
        <thead>
          <tr style={{ background: "#f4fafd" }}>
            <th style={{ padding: 5, border: "1px solid #dee4ef", minWidth: 115 }}>Position</th>
            <th style={{ padding: 5, border: "1px solid #dee4ef", minWidth: 56, textAlign: "right" }}>Menge</th>
            <th style={{ padding: 5, border: "1px solid #dee4ef", minWidth: 108, textAlign: "right" }}>Staffelpreis</th>
            <th style={{ padding: 5, border: "1px solid #dee4ef", minWidth: 98, textAlign: "right" }}>Gesamt (€)</th>
          </tr>
        </thead>
        <tbody>
          {labels.map((label, idx) => {
            const menge = quantities[idx];
            const s = staffelInfos[idx];
            const preisStr = s ? (s.art === "Pauschale" ? "Pauschale " : "Stückpreis ") + s.preis.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €" : "-";
            let summe = "0,00";
            if (hasPauschale && idx === pauschaleIdx) {
              summe = maxPauschale.toLocaleString("de-DE", { minimumFractionDigits: 2 });
            } else if (s && s.art !== "Pauschale" && typeof quantities[idx] === "number") {
              summe = (quantities[idx] as number * s.preis).toLocaleString("de-DE", { minimumFractionDigits: 2 });
            }
            return (
              <tr key={idx}>
                <td style={{
                  fontWeight: 700, color: "#0d53a3", fontSize: "0.94em", paddingRight: 5, verticalAlign: "middle"
                }}>
                  {label || <span style={{ color: "#e3e3e3" }}>–</span>}
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    max={MAX_MENGE}
                    value={quantities[idx]}
                    onChange={e => handleMengeChange(idx, e.target.value)}
                    style={{
                      width: 60, fontWeight: 700, fontSize: "1.01em",
                      textAlign: "right", background: "#f6fafc", border: "1.1px solid #e0e7f6",
                      borderRadius: 8, letterSpacing: "0.07em"
                    }}
                    placeholder="0"
                  />
                </td>
                <td style={{
                  color: "#145b82", fontWeight: 600, fontSize: "0.97em", textAlign: "right"
                }}>
                  {preisStr}
                </td>
                <td style={{ fontWeight: 700, color: "#20539a", fontSize: "0.98em", textAlign: "right" }}>
                  {summe}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ background: "#f6fafd", fontWeight: 700 }}>
            <td style={{ textAlign: "right", borderTop: "2px solid #c9e2fb" }}>Summe:</td>
            <td style={{ borderTop: "2px solid #c9e2fb" }}>{totalMenge}</td>
            <td style={{ borderTop: "2px solid #c9e2fb" }}></td>
            <td style={{ borderTop: "2px solid #c9e2fb" }}>
              {gesamt ? gesamt.toLocaleString("de-DE", { minimumFractionDigits: 2 }) + " €" : "–"}
            </td>
          </tr>
        </tfoot>
      </table>
      {/* Warn-Banner */}
      {warnung && (
        <div style={{
          background: "#fff3f3", color: "#be2d2d", padding: "10px 16px", borderRadius: 7,
          marginBottom: 16, fontWeight: 600, textAlign: "center"
        }}>
          Maximal 700 Stück insgesamt erlaubt!
        </div>
      )}
      {/* Durchschnittlicher Stückpreis */}
      <div style={{
        fontWeight: 700,
        fontSize: "1.08em",
        background: "#f4fafd",
        padding: "10px 0 9px",
        borderRadius: 8,
        color: "#146182",
        marginBottom: 7,
        marginTop: 5,
        textAlign: "center"
      }}>
        Durchschnittlicher Stückpreis:{" "}
        <span style={{ fontWeight: 900, fontSize: "1.15em" }}>
          {totalMenge > 0 && gesamt > 0
            ? (gesamt / totalMenge).toLocaleString("de-DE", { minimumFractionDigits: 3 }) + " €"
            : "–"}
        </span>
      </div>
      {/* Info: Pauschal oder Staffel */}
      <div style={{
        fontSize: "0.97em", background: "#e4f4f7", padding: "8px 10px", borderRadius: 7,
        color: "#216970", textAlign: "center", marginBottom: 13, fontWeight: 600
      }}>
        {infoText}
      </div>
      {/* Formularfelder */}
      <div style={{ margin: "17px 0 9px" }}>
        <div style={{ fontWeight: 600, color: "#134b5b", marginBottom: 5 }}>Referenz</div>
        <input
          type="text"
          className="input-modern"
          value={reference}
          onChange={e => setReference(e.target.value)}
          placeholder="z.B. Auftragsnummer"
          style={{
            width: "100%",
            padding: "10px 8px",
            borderRadius: 7,
            border: "1.1px solid #c6e2df",
            fontSize: "0.99em"
          }}
        />
      </div>
      {/* Rechnungsadresse */}
      <div style={{ margin: "12px 0 6px", fontWeight: 600, color: "#248184", fontSize: "0.96em" }}>Rechnungsadresse</div>
      {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
        <input
          key={field}
          name={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={rechnungsadresse[field as keyof Adresse] || ""}
          disabled
          style={{
            width: "100%",
            marginBottom: 6,
            background: "#f7fafb",
            border: "1px solid #dbe9f0",
            padding: "7px 7px",
            borderRadius: 6,
            fontSize: "0.97em",
            color: "#18404c",
            fontWeight: 500
          }}
        />
      ))}
      {/* Abholadresse */}
      <div style={{ margin: "14px 0 6px", fontWeight: 600, color: "#248184", fontSize: "0.96em" }}>Abholadresse</div>
      {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
        <input
          key={field}
          name={field}
          placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
          value={abholadresse[field as keyof Adresse] || ""}
          onChange={e => setAbholadresse(old => ({ ...old, [field]: e.target.value }))}
          style={{
            width: "100%",
            marginBottom: 6,
            background: "#f7fafb",
            border: "1px solid #dbe9f0",
            padding: "7px 7px",
            borderRadius: 6,
            fontSize: "0.97em"
          }}
        />
      ))}
      {/* Bemerkungen */}
      <div style={{ margin: "13px 0 6px", fontWeight: 600, color: "#248184", fontSize: "0.96em" }}>Bemerkungen</div>
      <textarea
        rows={2}
        className="input-modern"
        placeholder="Optional: Hinweise, Wünsche oder Rückfragen …"
        value={bemerkungen}
        onChange={e => setBemerkungen(e.target.value)}
        style={{
          width: "100%",
          padding: "9px 8px",
          borderRadius: 7,
          border: "1.1px solid #c6e2df",
          fontSize: "0.99em",
          minHeight: 40
        }}
      />
      {/* --- BUTTONS --- */}
      <div style={{ display: "flex", gap: "18px", marginTop: 18, justifyContent: "center" }}>
        <PdfDownloadButton getPdfHtml={getPdfHtml} />
        <a
          href={mailTo}
          className="cta-btn"
          style={{
            display: "inline-block",
            background: "#0053B3",
            color: "#fff",
            border: "none",
            borderRadius: 7,
            padding: "0.6em 1.4em",
            fontSize: "1.09em",
            fontWeight: "bold",
            cursor: "pointer",
            marginTop: "1em",
            textDecoration: "none",
            width: 200,
            minWidth: 200,
            textAlign: "center",
          }}
        >
          Per E-Mail senden
        </a>
      </div>
    </div>
  );
}

"use client";
import React, { useState } from "react";

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
    a.download = "Kalkulation.pdf";
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
        background: "#008060",
        color: "#fff",
        border: "none",
        borderRadius: 6,
        padding: "0.6em 1.4em",
        fontSize: "1.07em",
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

// ===== Haupt-Komponente =====
type KundeConfig = {
  labels: string[];
  palletUnits: number[];
  packagingMaterial: number[];
  packagingTime: number[];
  preise: {
    kmRateTable: number[][];
  };
  auftraggeber?: {
    firmenname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
};

type Props = { config: KundeConfig; kundennummer: string };

export default function AssetpreisKalkulator({ config, kundennummer }: Props) {
  const [km, setKm] = useState<number | "">("");
  const [quantities, setQuantities] = useState<(number | "")[]>(
    Array(config.labels.length).fill("")
  );
  const [reference, setReference] = useState("");

  const [abholadresse, setAbholadresse] = useState({
    firmenname: config.auftraggeber?.firmenname || "",
    strasse: config.auftraggeber?.strasse || "",
    plz: config.auftraggeber?.plz || "",
    ort: config.auftraggeber?.ort || "",
    land: config.auftraggeber?.land || "",
  });

  const [zieladresse, setZieladresse] = useState({
    firmenname: "",
    strasse: "",
    plz: "",
    ort: "",
    land: "",
  });

  const handleAbholadresseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAbholadresse({ ...abholadresse, [e.target.name]: e.target.value });
  };
  const handleZieladresseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZieladresse({ ...zieladresse, [e.target.name]: e.target.value });
  };

  const safeNum = (v: number | "") => (typeof v === "number" && !isNaN(v) ? v : 0);

  const totalQuantity = quantities.reduce(
    (acc: number, val) => acc + safeNum(val),
    0
  );
  const totalPallets = quantities.reduce(
    (acc: number, val, idx) => acc + safeNum(val) / config.palletUnits[idx],
    0
  );
  const roundedPallets = Math.ceil(totalPallets);

  let kmRate = 1.75;
  const kmRateTable = config.preise.kmRateTable;
  if (roundedPallets <= 2) kmRate = kmRateTable[0][3];
  else if (roundedPallets === 3) kmRate = kmRateTable[1][3];
  else if (roundedPallets <= 6) kmRate = kmRateTable[2][3];
  else kmRate = kmRateTable[3][3];

  const kmValue = safeNum(km);
  const kmAdjusted = kmValue + 70;
  let transportCost = kmAdjusted * kmRate;
  if (kmValue > 450) transportCost += 100;
  if (roundedPallets >= 7) transportCost += 400;
  if (roundedPallets >= 7 && kmValue > 450) transportCost += 500;

  const totalMaterial = quantities.reduce(
    (acc: number, val, idx) => acc + safeNum(val) * config.packagingMaterial[idx],
    0
  );
  const totalPackaging = quantities.reduce(
    (acc: number, val, idx) =>
      acc + (safeNum(val) * config.packagingTime[idx] * 40) / 60,
    0
  );
  const total = transportCost + totalMaterial + totalPackaging;
  const avgUnitPrice =
    totalQuantity > 0 ? (total / totalQuantity).toFixed(2) : "0.00";
  const totalCost = (Number(avgUnitPrice) * totalQuantity).toFixed(2);

  const showBanner = roundedPallets >= 26;

  // === MAILTO-Link vorbereiten (ohne max. Anzahl/Palette) ===
  const mailTo = (() => {
    const empfaenger = "Oliver.Pfizenmayer@logist.de";
    const subject = `Kalkulation ${kundennummer}${reference ? " - " + reference : ""}`;
    const bodyLines = [
      `Kundennummer: ${kundennummer}`,
      `Referenz: ${reference}`,
      "",
      "Kalkulation:",
      `----------------------------------------`,
      `Position\tAnzahl`,
      ...config.labels
        .map((label, idx) => {
          const anzahl = quantities[idx];
          if (anzahl === "" || anzahl == null) return null; // 0 ist erlaubt!
          return `${label}\t${anzahl}`;
        })
        .filter(Boolean),
      `----------------------------------------`,
      `Gesamtstückzahl: ${totalQuantity}`,
      `Palettenanzahl: ${roundedPallets}`,
      `Gesamtpreis netto: ${totalCost} €`,
      "",
      `Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}`,
      `Zieladresse: ${zieladresse.firmenname}, ${zieladresse.strasse}, ${zieladresse.plz} ${zieladresse.ort}, ${zieladresse.land}`
    ];
    const mailBody = encodeURIComponent(bodyLines.join('\n'));
    return `mailto:${empfaenger}?subject=${encodeURIComponent(subject)}&body=${mailBody}`;
  })();

  // === PDF-HTML für Download ===
  const getPdfHtml = () => {
    const rows = config.labels.map((label, idx) => {
      const anzahl = quantities[idx];
      if (anzahl === "" || anzahl == null) return ""; // 0 ist erlaubt!
      return `<tr>
        <td>${label}</td>
        <td>${anzahl}</td>
        <td>${config.palletUnits[idx]}</td>
      </tr>`;
    }).join("");
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Kalkulation</title>
        <style>
          body { font-family: Arial, sans-serif; font-size: 14px; margin: 16px; }
          table { border-collapse: collapse; width: 100%; margin: 1em 0; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background: #eee; }
          .highlight { font-weight: bold; }
          .highlight.green { color: #128300; }
          .highlight.blue { color: #0053B3; }
        </style>
      </head>
      <body>
        <h2>Kalkulation – Kundennummer: ${kundennummer}${reference ? " – " + reference : ""}</h2>
        <table>
          <thead>
            <tr>
              <th>Position</th>
              <th>Anzahl</th>
              <th>max. Stück/Palette</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <p>Gesamtstückzahl: <b>${totalQuantity}</b></p>
        <p>Palettenanzahl: <b>${roundedPallets}</b></p>
        <p>Gesamtpreis netto: <b>${totalCost} €</b></p>
        <hr />
        <p>Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}</p>
        <p>Zieladresse: ${zieladresse.firmenname}, ${zieladresse.strasse}, ${zieladresse.plz} ${zieladresse.ort}, ${zieladresse.land}</p>
      </body>
      </html>
    `;
  };

  return (
    <div className="main-container">
      <div style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "0 0 1.2rem 0"
      }}>
        <img src="/LogistLogo.png" alt="Firmenlogo" style={{ maxHeight: 64, maxWidth: 210, margin: "0 auto", display: "block" }} />
      </div>
      <h1 style={{ textAlign: "center", marginBottom: 10 }}>
        Assetpreis-Kalkulator
        <br />
        <span style={{
          fontSize: "1.12rem",
          color: "#888",
          fontWeight: 500,
          letterSpacing: 0,
          display: "block",
          marginTop: 6,
        }}>
          Kundennummer: <b>{kundennummer}</b>
        </span>
      </h1>

      <form>
        <table className="form-table">
          <tbody>
            <tr>
              <td className="form-label">km Eingabe</td>
              <td>
                <input
                  type="number"
                  min="0"
                  className="input-modern"
                  value={km}
                  onChange={e => setKm(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="z.B. 120"
                />
              </td>
            </tr>
            {config.labels.map((label, idx) => (
              <tr key={idx}>
                <td className="form-label">{label}</td>
                <td>
                  <input
                    type="number"
                    min="0"
                    className="input-modern"
                    value={quantities[idx]}
                    onChange={e => {
                      const updated = [...quantities];
                      updated[idx] = e.target.value === "" ? "" : Number(e.target.value);
                      setQuantities(updated);
                    }}
                    placeholder="Anzahl"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="result-table">
          <thead>
            <tr>
              <th>∅ Stückpreis</th>
              <th>Palettenanzahl</th>
              <th>Gesamtpreis netto</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="highlight blue">{avgUnitPrice} €</td>
              <td className="highlight">{roundedPallets}</td>
              <td className="highlight green">{totalCost} €</td>
            </tr>
          </tbody>
        </table>

        {showBanner && (
          <div className="banner-warning">
            Bei Palettenanzahl ab 26 erhalten Sie ein individuelles Angebot. Bitte senden Sie Ihre Anfrage per E-Mail an <a href="mailto:info@logist.de">info@logist.de</a>.
          </div>
        )}

        <div className="ref-row">
          <label>Referenz</label>
          <input
            type="text"
            className="input-modern"
            value={reference}
            onChange={e => setReference(e.target.value)}
            placeholder="z.B. Auftragsnummer"
          />
        </div>

        <fieldset>
          <legend>Abholadresse</legend>
          <input name="firmenname" placeholder="Firmenname" value={abholadresse.firmenname} onChange={handleAbholadresseChange} required />
          <input name="strasse" placeholder="Straße" value={abholadresse.strasse} onChange={handleAbholadresseChange} required />
          <input name="plz" placeholder="PLZ" value={abholadresse.plz} onChange={handleAbholadresseChange} required />
          <input name="ort" placeholder="Ort" value={abholadresse.ort} onChange={handleAbholadresseChange} required />
          <input name="land" placeholder="Land" value={abholadresse.land} onChange={handleAbholadresseChange} required />
        </fieldset>

        <fieldset>
          <legend>Zieladresse</legend>
          <input name="firmenname" placeholder="Firmenname" value={zieladresse.firmenname} onChange={handleZieladresseChange} required />
          <input name="strasse" placeholder="Straße" value={zieladresse.strasse} onChange={handleZieladresseChange} required />
          <input name="plz" placeholder="PLZ" value={zieladresse.plz} onChange={handleZieladresseChange} required />
          <input name="ort" placeholder="Ort" value={zieladresse.ort} onChange={handleZieladresseChange} required />
          <input name="land" placeholder="Land" value={zieladresse.land} onChange={handleZieladresseChange} required />
        </fieldset>

        {/* --- BUTTONS --- */}
        <div style={{ display: "flex", gap: "18px", marginTop: 18, justifyContent: "center" }}>
          <PdfDownloadButton getPdfHtml={getPdfHtml} />
          {!showBanner && (
            <a
              href={mailTo}
              className="cta-btn"
              style={{
                display: "inline-block",
                background: "#0053B3",
                color: "#fff",
                border: "none",
                borderRadius: 6,
                padding: "0.6em 1.4em",
                fontSize: "1.07em",
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
          )}
        </div>
      </form>
    </div>
  );
}

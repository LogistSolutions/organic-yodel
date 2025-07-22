"use client";
import React, { useState } from "react";

// PDF-HTML-Download-Button (optional)
function PdfHtmlDownloadButton({ selector = "#pdf-content" }) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    const element = document.querySelector(selector);
    if (!element) {
      alert("PDF-Bereich nicht gefunden!");
      setLoading(false);
      return;
    }
    const contentHtml = element.outerHTML;

    const html = `
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
          .banner-warning { background: #ffe0ac; padding: 8px 14px; margin: 1em 0; border-radius: 8px; }
          .success-message { background: #e0ffe8; color: #1e6c3c; padding: 8px 14px; margin: 1em 0; border-radius: 8px; }
          .cta-btn { background: #0070f3; color: #fff; border: none; border-radius: 6px; padding: 0.6em 1.4em; font-size: 1.07em; font-weight: bold; cursor: pointer; margin-top: 1em; }
          .ref-row { display: flex; align-items: center; gap: 10px; margin: 1em 0; }
          .input-modern { border: 1px solid #bbb; border-radius: 6px; padding: 6px 9px; width: 100%; }
          fieldset { border: 1px solid #ccc; border-radius: 7px; margin: 1em 0; padding: 8px 12px; }
          legend { font-weight: bold; color: #0053B3; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

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
        marginTop: 16,
        background: "#008060",
        color: "#fff",
        padding: "0.5rem 1.2rem",
        border: "none",
        borderRadius: 8,
        fontWeight: "bold",
        cursor: loading ? "not-allowed" : "pointer",
      }}
    >
      {loading ? "PDF wird erstellt..." : "PDF (Ansicht) herunterladen"}
    </button>
  );
}

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
  const [submitted, setSubmitted] = useState(false);

  const [auftraggeber, setAuftraggeber] = useState({
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

  const handleAuftraggeberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAuftraggeber({ ...auftraggeber, [e.target.name]: e.target.value });
  };
  const handleZieladresseChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setZieladresse({ ...zieladresse, [e.target.name]: e.target.value });
  };

  const safeNum = (v: number | "") =>
    typeof v === "number" && !isNaN(v) ? v : 0;

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

  // ------ PDF VERSAND BEIM BEAUFTRAGEN -------
  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !zieladresse.firmenname ||
      !zieladresse.strasse ||
      !zieladresse.plz ||
      !zieladresse.ort ||
      !zieladresse.land
    ) {
      alert("Bitte fülle alle Felder der Zieladresse aus!");
      return;
    }

    // HTML für PDF holen
    const element = document.querySelector("#pdf-content");
    if (!element) {
      alert("PDF-Bereich nicht gefunden!");
      return;
    }
    const contentHtml = element.outerHTML;
    const html = `
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
          .banner-warning { background: #ffe0ac; padding: 8px 14px; margin: 1em 0; border-radius: 8px; }
          .success-message { background: #e0ffe8; color: #1e6c3c; padding: 8px 14px; margin: 1em 0; border-radius: 8px; }
          .cta-btn { background: #0070f3; color: #fff; border: none; border-radius: 6px; padding: 0.6em 1.4em; font-size: 1.07em; font-weight: bold; cursor: pointer; margin-top: 1em; }
          .ref-row { display: flex; align-items: center; gap: 10px; margin: 1em 0; }
          .input-modern { border: 1px solid #bbb; border-radius: 6px; padding: 6px 9px; width: 100%; }
          fieldset { border: 1px solid #ccc; border-radius: 7px; margin: 1em 0; padding: 8px 12px; }
          legend { font-weight: bold; color: #0053B3; }
        </style>
      </head>
      <body>
        ${contentHtml}
      </body>
      </html>
    `;

    // E-Mail-Empfänger fest:
    const empfaengerMail = "Oliver.Pfizenmayer@logist.de";

    // Sende an die API:
    const res = await fetch("/api/send-mail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        kundenNummer: kundennummer,
        referenz: reference,
        empfaengerMail,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      alert("Fehler beim E-Mail-Versand: " + (err.error || "unbekannt"));
      return;
    }

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const showBanner = roundedPallets >= 26;

  return (
    <div className="main-container">
      {/* ALLES, was im PDF landen soll! */}
      <div id="pdf-content">
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
            <legend>Auftraggeber</legend>
            <input name="firmenname" placeholder="Firmenname" value={auftraggeber.firmenname} onChange={handleAuftraggeberChange} required />
            <input name="strasse" placeholder="Straße" value={auftraggeber.strasse} onChange={handleAuftraggeberChange} required />
            <input name="plz" placeholder="PLZ" value={auftraggeber.plz} onChange={handleAuftraggeberChange} required />
            <input name="ort" placeholder="Ort" value={auftraggeber.ort} onChange={handleAuftraggeberChange} required />
            <input name="land" placeholder="Land" value={auftraggeber.land} onChange={handleAuftraggeberChange} required />
          </fieldset>

          <fieldset>
            <legend>Zieladresse</legend>
            <input name="firmenname" placeholder="Firmenname" value={zieladresse.firmenname} onChange={handleZieladresseChange} required />
            <input name="strasse" placeholder="Straße" value={zieladresse.strasse} onChange={handleZieladresseChange} required />
            <input name="plz" placeholder="PLZ" value={zieladresse.plz} onChange={handleZieladresseChange} required />
            <input name="ort" placeholder="Ort" value={zieladresse.ort} onChange={handleZieladresseChange} required />
            <input name="land" placeholder="Land" value={zieladresse.land} onChange={handleZieladresseChange} required />
          </fieldset>
        </form>
      </div>
      {/* PDF-Button außerhalb des pdf-content, damit er nicht im PDF ist! */}
      <PdfHtmlDownloadButton selector="#pdf-content" />
      {/* Das echte Beauftragen-Formular für den Versand */}
      <form onSubmit={handleOrder}>
        {!showBanner && (
          <button type="submit" className="cta-btn">
            Beauftragen & PDF per E-Mail senden
          </button>
        )}
        {submitted && (
          <div className="success-message">
            Bestellung wurde registriert & PDF gesendet.
          </div>
        )}
      </form>
    </div>
  );
}

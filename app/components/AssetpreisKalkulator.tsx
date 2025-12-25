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
  labels?: string[];
  palletUnits?: number[];
  packagingMaterial?: number[];
  packagingTime?: number[];
  abholadresse?: Adresse;
  lieferadresse_abweichend?: boolean;   // ← HINZUFÜGEN!
  lieferadresse?: Adresse;              // ← (optional, falls noch nicht drin)
  preise?: {
    kmRateTable?: number[][];
  };
  rechnung?: {
    firmenname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
};

type Adresse = {
  firmenname: string;
  strasse: string;
  plz: string;
  ort: string;
  land: string;
};

type Props = { config: KundeConfig; kundennummer: string };

export default function AssetpreisKalkulator({ config, kundennummer }: Props) {
  const [km, setKm] = useState<number | "">("");
  const [quantities, setQuantities] = useState<(number | "")[]>(
  Array(config.labels?.length ?? 0).fill("")
  );
  const [reference, setReference] = useState("");
  const [bemerkungen, setBemerkungen] = useState(""); // <---- Neu

  // Rechnungsadresse (aus admin)
  const [rechnungsadresse] = useState<Adresse>({
    firmenname: config.rechnung?.firmenname || "",
    strasse: config.rechnung?.strasse || "",
    plz: config.rechnung?.plz || "",
    ort: config.rechnung?.ort || "",
    land: config.rechnung?.land || "",
  });

  // Abholadresse (immer leer, oder vorausgefüllt je nach Wunsch)
  const [abholadresse, setAbholadresse] = useState<Adresse>({
    firmenname: "",
    strasse: "",
    plz: "",
    ort: "",
    land: "",
  });
  // Abweichende Lieferadresse (Checkbox + Zieladresse)
const [abweichendeLieferadresse, setAbweichendeLieferadresse] = useState(
  !!config.lieferadresse_abweichend
);

const [zieladresse, setZieladresse] = useState<Adresse>(
  config.lieferadresse_abweichend && config.lieferadresse
    ? { ...config.lieferadresse }
    : { firmenname: "", strasse: "", plz: "", ort: "", land: "" }
);

  // Change Handler
  const handleAdresseChange = (
    setter: React.Dispatch<React.SetStateAction<Adresse>>,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setter((old) => ({ ...old, [e.target.name]: e.target.value }));
  };

  // Hilfsfunktionen
 const safeNum = (v: number | "" | undefined | null) =>
  typeof v === "number" && !isNaN(v) ? v : 0;

  const totalQuantity = quantities.reduce(
    (acc: number, val) => acc + safeNum(val),
    0
  );
const palletUnits = config.palletUnits ?? [];
const totalPallets = quantities.reduce(
  (acc: number, val, idx) => {
    const divisor = palletUnits[idx];
    if (typeof divisor !== "number" || divisor <= 0) {
      console.warn(`Ungültiger palletUnit-Wert an Index ${idx}:`, divisor);
      return acc;
    }
    return acc + safeNum(val) / divisor;
  },
  0
);

  const roundedPallets = Math.ceil(totalPallets);

// Neue kmRate anhand fester Staffelung
const kmRateList = [
  1.65, 1.75, 1.8, 2.7, 3.2, 3.2, 3.3, 3.4, 3.5, 3.5,
  3.5, 3.5, 3.6, 3.6, 3.6, 3.6, 4.1, 4.1, 4.1, 4.1,
  4.1, 4.2, 4.2, 4.25, 4.25
];

let kmRate = 4.35; // Default für > 25 Paletten
if (roundedPallets >= 1 && roundedPallets <= kmRateList.length) {
  kmRate = kmRateList[roundedPallets - 1];
}

const kmValue = safeNum(km);
// ---- DYNAMISCHER ZUSCHLAG NACH ENTFERNUNG ----
let kmExtra = 70; // Standardwert ab 151 km
if (kmValue <= 50) {
  kmExtra = 130;
} else if (kmValue <= 100) {
  kmExtra = 120;
} else if (kmValue <= 150) {
  kmExtra = 110;
} else if (kmValue <= 200) {
  kmExtra = 100;
}

const kmAdjusted = kmValue + kmExtra;

// ----- NEUE ZUSCHLAG-LOGIK -----
let zuschlag = 0;

if (roundedPallets < 7 && kmValue > 450) {
  zuschlag += 100;
}
if (roundedPallets >= 7 && roundedPallets < 12) {
  zuschlag += 400;
  if (kmValue > 450) zuschlag += 500;
}
if (roundedPallets >= 12) {
  zuschlag += 800;
  if (kmValue > 450) zuschlag += 1000;
}
let transportCost = kmAdjusted * kmRate + zuschlag;

console.log("quantities:", quantities);
console.log("palletUnits:", config.palletUnits);
console.log("config.packagingMaterial:", config.packagingMaterial);
console.log("config.packagingTime:", config.packagingTime);

const totalMaterial = quantities.reduce(
  (acc: number, val, idx) =>
    acc + safeNum(val) * safeNum(config.packagingMaterial?.[idx]),
  0
);

const totalPackaging = quantities.reduce(
  (acc: number, val, idx) =>
    acc + (safeNum(val) * safeNum(config.packagingTime?.[idx]) * 40) / 60,
  0
);

  const total = transportCost + totalMaterial + totalPackaging;
  const avgUnitPrice =
    totalQuantity > 0 ? (total / totalQuantity).toFixed(2) : "0.00";
  const totalCost = (Number(avgUnitPrice) * totalQuantity).toFixed(2);

  const showBanner = roundedPallets >= 26;
// === MAILTO-Link vorbereiten ===
const mailTo = (() => {
  const empfaenger = "Dispo@logist.de";
const subject = `${rechnungsadresse.firmenname}${reference ? " – " + reference : ""}`;

  // Berechnung für Spaltenbreite
  const labelWidth = Math.max(...config.labels.map(l => l.length), 30) + 2;
  const asciiRows = config.labels
    .map((label, idx) => {
      const anzahl = quantities[idx];
      if (anzahl === "" || anzahl == null) return null;
      return label.padEnd(labelWidth) + String(anzahl).padStart(6, " ");
    })
    .filter(Boolean)
    .join("\n");

  const bodyLines = [
    `Kundennummer: ${kundennummer}`,
    `Kunde: ${rechnungsadresse.firmenname}`,
    `Referenz: ${reference}`,
    "",
    "Kalkulation:",
    "----------------------------------------",
    "Position".padEnd(labelWidth) + "Anzahl",
    asciiRows,
    "----------------------------------------",
    `Gesamtstückzahl: ${totalQuantity}`,
    `Palettenanzahl: ${roundedPallets}`,
    `Gesamtpreis netto: ${totalCost} €`,
    "",
    `Rechnungsadresse: ${rechnungsadresse.firmenname}, ${rechnungsadresse.strasse}, ${rechnungsadresse.plz} ${rechnungsadresse.ort}, ${rechnungsadresse.land}`,
    "",
    abweichendeLieferadresse
      ? `Lieferadresse: ${zieladresse.firmenname}, ${zieladresse.strasse}, ${zieladresse.plz} ${zieladresse.ort}, ${zieladresse.land}`
      : "Abweichende Lieferadresse: Nein",
    "",
    `Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}`,
    "",
    `Bemerkungen: ${bemerkungen.trim() ? bemerkungen.trim() : "Keine"}`
  ];
const mailBody = encodeURIComponent(bodyLines.join('\n'));
return `mailto:${empfaenger}?subject=${encodeURIComponent(subject)}&body=${mailBody}`;
})();


// === PDF-HTML für Download ===
const getPdfHtml = () => {
  // Tabelle: nur Position + Anzahl
  const rows = config.labels.map((label, idx) => {
    const anzahl = quantities[idx];
    if (anzahl === "" || anzahl == null) return "";
    return `<tr>
      <td>${label}</td>
      <td>${anzahl}</td>
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
        .remarks-box {
          background: #f8fafb;
          border: 1.5px solid #cce1dd;
          border-radius: 10px;
          padding: 14px 16px 12px 16px;
          margin: 28px 0 2px 0;
          font-size: 1.08em;
          color: #174535;
        }
      </style>
    </head>
    <body>
      <h2>Kalkulation – ${rechnungsadresse.firmenname}${reference ? " – " + reference : ""}</h2>
      <table>
        <thead>
          <tr>
            <th>Position</th>
            <th>Anzahl</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p>Gesamtstückzahl: <b>${totalQuantity}</b></p>
      <p>Palettenanzahl: <b>${roundedPallets}</b></p>
      <p>Gesamtpreis netto: <b>${totalCost} €</b></p>
      <hr />
      <p>Rechnungsadresse: ${rechnungsadresse.firmenname}, ${rechnungsadresse.strasse}, ${rechnungsadresse.plz} ${rechnungsadresse.ort}, ${rechnungsadresse.land}</p>
      ${
        abweichendeLieferadresse
          ? `<p>Lieferadresse: ${zieladresse.firmenname}, ${zieladresse.strasse}, ${zieladresse.plz} ${zieladresse.ort}, ${zieladresse.land}</p>`
          : "<p>Abweichende Lieferadresse: Nein</p>"
      }
      <p>Abholadresse: ${abholadresse.firmenname}, ${abholadresse.strasse}, ${abholadresse.plz} ${abholadresse.ort}, ${abholadresse.land}</p>
      <div class="remarks-box">
        <b>Bemerkungen:</b><br/>
        ${bemerkungen.trim() ? bemerkungen.trim().replace(/\n/g, "<br/>") : "Keine"}
      </div>
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
              <td className="form-label">km Eingabe einfache Strecke</td>
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
{/*
// Tabelle zum anschauen der Kalkulation.
<table className="result-table" style={{ marginTop: 20 }}>
  <thead>
    <tr>
      <th>Component</th>
      <th>Amount (€)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Transport cost<br />
        <small>{kmAdjusted} km × {kmRate.toFixed(2)} € + surcharge {zuschlag} €</small>
      </td>
      <td>{transportCost.toFixed(2)} €</td>
    </tr>
    <tr>
      <td>Packaging material</td>
      <td>{totalMaterial.toFixed(2)} €</td>
    </tr>
    <tr>
      <td>Packaging time</td>
      <td>{totalPackaging.toFixed(2)} €</td>
    </tr>
    <tr>
      <td><b>Total</b></td>
      <td><b>{total.toFixed(2)} €</b></td>
    </tr>
  </tbody>
</table>
*/}
        {showBanner && (
          <div className="banner-warning">
            Bei Palettenanzahl ab 26 erhalten Sie ein individuelles Angebot. Bitte senden Sie Ihre Anfrage per E-Mail an <a href="mailto:dispo@logist.de">dispo@logist.de</a>.
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

        {/* Rechnungsadresse */}
        <fieldset>
          <legend>Rechnungsadresse</legend>
          <input name="firmenname" placeholder="Firmenname" value={rechnungsadresse.firmenname} disabled />
          <input name="strasse" placeholder="Straße" value={rechnungsadresse.strasse} disabled />
          <input name="plz" placeholder="PLZ" value={rechnungsadresse.plz} disabled />
          <input name="ort" placeholder="Ort" value={rechnungsadresse.ort} disabled />
          <input name="land" placeholder="Land" value={rechnungsadresse.land} disabled />
        </fieldset>

        {/* Abholadresse */}
        <fieldset>
          <legend>Abholadresse</legend>
          <input name="firmenname" placeholder="Firmenname" value={abholadresse.firmenname} onChange={e => handleAdresseChange(setAbholadresse, e)} required />
          <input name="strasse" placeholder="Straße" value={abholadresse.strasse} onChange={e => handleAdresseChange(setAbholadresse, e)} required />
          <input name="plz" placeholder="PLZ" value={abholadresse.plz} onChange={e => handleAdresseChange(setAbholadresse, e)} required />
          <input name="ort" placeholder="Ort" value={abholadresse.ort} onChange={e => handleAdresseChange(setAbholadresse, e)} required />
          <input name="land" placeholder="Land" value={abholadresse.land} onChange={e => handleAdresseChange(setAbholadresse, e)} required />
        </fieldset>

        {/* Abweichende Zieladresse */}
        <div style={{ margin: "1.5em 0 0.3em 0" }}>
  <label style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 600 }}>
    <input
      type="checkbox"
      checked={abweichendeLieferadresse}
      onChange={e => setAbweichendeLieferadresse(e.target.checked)}
      style={{ accentColor: "#008060", width: 18, height: 18 }}
    />
    Abweichende Ziel-Adresse
  </label>
</div>
{abweichendeLieferadresse && (
  <fieldset className="zieladresse-feldset">
    <legend style={{ color: "#2aabe2", fontWeight: 700, fontSize: "1.07em" }}>
      Lieferadresse (abweichend)
    </legend>
    <input name="firmenname" placeholder="Firmenname" value={zieladresse.firmenname} onChange={e => handleAdresseChange(setZieladresse, e)} required />
    <input name="strasse" placeholder="Straße" value={zieladresse.strasse} onChange={e => handleAdresseChange(setZieladresse, e)} required />
    <input name="plz" placeholder="PLZ" value={zieladresse.plz} onChange={e => handleAdresseChange(setZieladresse, e)} required />
    <input name="ort" placeholder="Ort" value={zieladresse.ort} onChange={e => handleAdresseChange(setZieladresse, e)} required />
    <input name="land" placeholder="Land" value={zieladresse.land} onChange={e => handleAdresseChange(setZieladresse, e)} required />
  </fieldset>
)}
        {/* ==== BEMERKUNGEN ==== */}
        <div
          className="bemerkungen-row"
          style={{
            background: "#f7fafb",
            border: "1.5px solid #cce1dd",
            borderRadius: 12,
            padding: "16px 17px 12px 17px",
            margin: "32px 0 18px 0",
            boxShadow: "0 2px 18px #ddeee736",
            color: "#165340",
            transition: "box-shadow .18s"
          }}
        >
          <label htmlFor="bemerkungen" style={{ fontWeight: 600, color: "#165340", fontSize: "1.11em", marginBottom: 8, display: "block" }}>
            Bemerkungen:
          </label>
          <textarea
            id="bemerkungen"
            className="input-modern"
            rows={3}
            placeholder="Pflicht: Ansprechpartner Abholdadresse. Optional: Hinweise, Wünsche oder Rückfragen …"
            value={bemerkungen}
            onChange={e => setBemerkungen(e.target.value)}
            style={{
              width: "100%",
              minHeight: 58,
              fontSize: "1.09em",
              padding: "11px 10px",
              background: "#fff",
              color: "#185c44",
              border: "1.5px solid #c3e1d8",
              borderRadius: 7,
              boxShadow: "0 1px 7px #ddeee744",
              resize: "vertical",
              outline: "none",
              transition: "border .15s, box-shadow .15s"
            }}
            onFocus={e => e.currentTarget.style.border = "1.7px solid #53b692"}
            onBlur={e => e.currentTarget.style.border = "1.5px solid #c3e1d8"}
          />
        </div>

        {/* --- BUTTONS --- */}
        <div style={{ display: "flex", gap: "18px", marginTop: 18, justifyContent: "center" }}>
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

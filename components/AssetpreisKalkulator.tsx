"use client";
import React, { useState } from "react";

export default function AssetpreisKalkulator() {
  // Startzustand: Felder sind leer
  const [km, setKm] = useState<number | "">("");
  const [quantities, setQuantities] = useState<(number | "")[]>(["", "", "", "", "", ""]);
  const [customerName, setCustomerName] = useState("");
  const [reference, setReference] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const palletUnits = [250, 170, 65, 28, 20, 14];
  const packagingMaterial = [0.1, 0.12, 0.14, 0.15, 0.15, 0.2];
  const packagingTime = [0.25, 0.35, 0.5, 0.6, 0.75, 1];
  const assetLabels = [
    "0–1 kg (Mobiles/Accesspoints/Telefone/Dockings etc.)",
    "1–3 kg (Notebooks/Pads/ThinClients etc.)",
    "3,1–6 kg (Desktops, Switch etc.)",
    "6,1–13 kg (Tower-PC/Tischdrucker/TFT etc.)",
    "13,1–20 kg (Drucker/ kleine Server etc.)",
    "20,1–30 kg (Drucker/Server etc.)"
  ];
  const kmRateTable = [
    [1.2, 1.4, 1.6, 1.75, 2, 2.2],
    [1.3, 1.5, 1.7, 1.75, 2, 2.3],
    [1.4, 1.6, 1.8, 1.75, 2.1, 2.4],
    [1.6, 1.7, 1.9, 2, 2.2, 2.5],
  ];

  // Hilfsfunktion für leere/nicht-Zahlen
  const safeNum = (v: number | "") => (typeof v === "number" && !isNaN(v) ? v : 0);

  // Typisierte Reduces!
  const totalQuantity = quantities.reduce((acc: number, val) => acc + safeNum(val), 0);
  const totalPallets = quantities.reduce(
    (acc: number, val, idx) => acc + safeNum(val) / palletUnits[idx],
    0
  );
  const roundedPallets = Math.ceil(totalPallets);

  let kmRate = 1.75;
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
    (acc: number, val, idx) => acc + safeNum(val) * packagingMaterial[idx],
    0
  );
  const totalPackaging = quantities.reduce(
    (acc: number, val, idx) => acc + (safeNum(val) * packagingTime[idx] * 40) / 60,
    0
  );
  const total = transportCost + totalMaterial + totalPackaging;
  const avgUnitPrice = totalQuantity > 0 ? (total / totalQuantity).toFixed(2) : "0.00";
  const totalCost = (Number(avgUnitPrice) * totalQuantity).toFixed(2);

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const showBanner = roundedPallets >= 26;

  return (
    <div className="main-container">
      <div className="logo-wrapper" style={{ marginBottom: '0.3rem' }}>
        <img src="/LogistLogo.png" alt="Firmenlogo" />
      </div>
      <h1>Assetpreis-Kalkulator</h1>
      <form onSubmit={handleOrder}>
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
            {assetLabels.map((label, idx) => (
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

        <div className="input-row">
          <div>
            <label>Kundennamen</label>
            <input
              type="text"
              className="input-modern"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="z.B. Max Mustermann"
            />
          </div>
          <div>
            <label>Referenz</label>
            <input
              type="text"
              className="input-modern"
              value={reference}
              onChange={e => setReference(e.target.value)}
              placeholder="z.B. Auftragsnummer"
            />
          </div>
        </div>
        {!showBanner && (
          <button type="submit" className="cta-btn">
            Beauftragen
          </button>
        )}
        {submitted && (
          <div className="success-message">
            Bestellung wurde registriert.
          </div>
        )}
      </form>
    </div>
  );
}

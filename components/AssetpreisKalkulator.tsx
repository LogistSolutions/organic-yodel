"use client";
import React, { useState } from "react";

export default function AssetpreisKalkulator() {
  const [km, setKm] = useState(0);
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0]);
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

  const totalQuantity = quantities.reduce((acc, val) => acc + val, 0);
  const totalPallets = quantities.reduce(
    (acc, val, idx) => acc + val / palletUnits[idx],
    0
  );
  const roundedPallets = Math.ceil(totalPallets);

  let kmRate = 1.75;
  if (roundedPallets <= 2) kmRate = kmRateTable[0][3];
  else if (roundedPallets === 3) kmRate = kmRateTable[1][3];
  else if (roundedPallets <= 6) kmRate = kmRateTable[2][3];
  else kmRate = kmRateTable[3][3];

  const kmAdjusted = km + 70;
  let transportCost = kmAdjusted * kmRate;
  if (km > 450) transportCost += 100;
  if (roundedPallets >= 7) transportCost += 400;
  if (roundedPallets >= 7 && km > 450) transportCost += 500;

  const totalMaterial = quantities.reduce(
    (acc, val, idx) => acc + val * packagingMaterial[idx],
    0
  );
  const totalPackaging = quantities.reduce(
    (acc, val, idx) => acc + (val * packagingTime[idx] * 40) / 60,
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

  return (
    <div className="main-container">
      <div className="logo-wrapper">
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
                  onChange={e => setKm(Number(e.target.value))}
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
                      updated[idx] = Number(e.target.value);
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
        <button type="submit" className="cta-btn">
          Beauftragen
        </button>
        {submitted && (
          <div className="success-message">
            Bestellung wurde registriert.
          </div>
        )}
      </form>
    </div>
  );
}

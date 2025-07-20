"use client";
import React, { useState } from "react";

export default function AssetpreisKalkulator() {
  const [km, setKm] = useState(0);
  const [quantities, setQuantities] = useState([0, 0, 0, 0, 0, 0]);
  const [submitted, setSubmitted] = useState(false);
  const [customerName, setCustomerName] = useState("");

  // Neue Palettenwerte!
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

  // Neue km-Staffelung wie gehabt:
  const kmRateTable = [
    [1.2, 1.4, 1.6, 1.75, 2, 2.2],   // 1-2 Paletten
    [1.3, 1.5, 1.7, 1.75, 2, 2.3],   // 3 Paletten
    [1.4, 1.6, 1.8, 1.75, 2.1, 2.4], // 4-6 Paletten
    [1.6, 1.7, 1.9, 2, 2.2, 2.5],    // 7+ Paletten
  ];

  const totalQuantity = quantities.reduce((acc, val) => acc + val, 0);
  const totalPallets = quantities.reduce(
    (acc, val, idx) => acc + val / palletUnits[idx],
    0
  );
  const roundedPallets = Math.ceil(totalPallets);

  // Logik für km-Satz-Staffel
  let kmRate = 1.75;
  if (roundedPallets <= 2) kmRate = kmRateTable[0][3];
  else if (roundedPallets === 3) kmRate = kmRateTable[1][3];
  else if (roundedPallets <= 6) kmRate = kmRateTable[2][3];
  else kmRate = kmRateTable[3][3];

  // Logik für Berechnung
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

  const handleOrder = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* HEADER */}
      <div className="w-full bg-white shadow-md py-4 px-6 flex items-center justify-between rounded-b-lg mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-gray-800">Assetpreis-Kalkulator</h1>
        <img src="/LogistLogo.jpg" alt="Firmenlogo" className="h-12 w-auto" />
      </div>

      {/* CARD */}
      <div className="shadow-lg rounded-2xl bg-white max-w-3xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row gap-8 p-8">
          {/* Eingaben */}
          <div className="flex-1 space-y-4">
            <label className="block text-gray-700 font-semibold mb-1">km Eingabe</label>
            <input
              type="number"
              min="0"
              className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
              value={km}
              onChange={e => setKm(Number(e.target.value))}
            />
            {assetLabels.map((label, idx) => (
              <div key={idx} className="mb-2">
                <label className="block text-gray-700">{label}</label>
                <input
                  type="number"
                  min="0"
                  className="w-full border rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-blue-500"
                  value={quantities[idx]}
                  onChange={e => {
                    const updated = [...quantities];
                    updated[idx] = Number(e.target.value);
                    setQuantities(updated);
                  }}
                />
              </div>
            ))}
            <div className="mt-6">
              <label className="block text-gray-700 font-semibold mb-1">Kundennamen eingeben</label>
              <input
                type="text"
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
              />
            <button
              className="bg-blue-600 text-white py-2 px-6 rounded-lg font-semibold mt-4 hover:bg-blue-700 transition"
              onClick={handleOrder}
            >
              Beauftragen
            </button>
            {submitted && (
              <div className="mt-2 text-green-600 font-semibold">
                Bestellung wurde registriert.
              </div>
            )}
          </div>

          {/* Ergebnisse */}
          <div className="flex-1 bg-gray-50 rounded-xl p-6 shadow-inner flex flex-col justify-center min-h-[320px] space-y-4">
            <div>
              <div className="text-gray-600 text-lg">∅ Stückpreis</div>
              <div className="font-bold text-3xl text-blue-600">{avgUnitPrice} €</div>
            </div>
            <div>
              <div className="text-gray-600">geschätzte Palettenanzahl</div>
              <div className="font-bold text-xl">{roundedPallets}</div>
            </div>
            <div>
              <div className="text-gray-600">Gesamtpreis netto</div>
              <div className="font-bold text-2xl text-green-700">{totalCost} €</div>
            </div>
          </div>
        </div>
      </div>
    </div>
        </div>
  );
}

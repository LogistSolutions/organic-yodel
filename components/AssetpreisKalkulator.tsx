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

  const handleOrder = () => {
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center py-8">
      <div className="flex flex-col items-center">
        <img
          src="/LogistLogo.png"
          alt="Firmenlogo"
          className="h-32 w-auto mb-12 drop-shadow-lg"
          style={{ marginTop: "2cm" }}
        />
      </div>
      <div className="shadow-2xl rounded-3xl bg-white mx-auto w-full max-w-3xl px-8 py-12 border border-slate-100">
        <h1 className="text-4xl font-black text-center text-slate-800 mb-8 tracking-tight">
          Assetpreis-Kalkulator
        </h1>
        <div className="flex flex-col md:flex-row gap-10">
          {/* Linke Seite: Tabelle mit Eingabefeldern */}
          <div className="flex-1">
            <table className="w-full rounded-xl overflow-hidden shadow border border-slate-100">
              <tbody>
                <tr className="h-14">
                  <td className="pr-4 align-middle text-right font-semibold text-slate-700">km Eingabe</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                      value={km}
                      onChange={e => setKm(Number(e.target.value))}
                      placeholder="z.B. 120"
                    />
                  </td>
                </tr>
                {assetLabels.map((label, idx) => (
                  <tr key={idx} className="h-16">
                    <td className="pr-4 align-middle text-right font-medium text-slate-700">{label}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
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
          </div>
          {/* Rechte Seite: Ergebnisse */}
          <div className="flex-1 flex flex-col justify-center">
            <table className="w-full text-center border-separate" style={{ borderSpacing: "0 1.2em" }}>
              <tbody>
                <tr>
                  <td className="text-slate-500 text-md font-semibold">∅ Stückpreis</td>
                  <td className="text-slate-500 text-md font-semibold">Palettenanzahl</td>
                  <td className="text-slate-500 text-md font-semibold">Gesamtpreis netto</td>
                </tr>
                <tr>
                  <td className="font-black text-2xl text-blue-700">{avgUnitPrice} €</td>
                  <td className="font-black text-2xl">{roundedPallets}</td>
                  <td className="font-black text-2xl text-green-700">{totalCost} €</td>
                </tr>
              </tbody>
            </table>
            {/* Kundendaten */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
              <div>
                <label className="block mb-1 text-slate-700 font-semibold">Kundennamen</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="z.B. Max Mustermann"
                />
              </div>
              <div>
                <label className="block mb-1 text-slate-700 font-semibold">Referenz</label>
                <input
                  type="text"
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  placeholder="z.B. Auftragsnummer"
                />
              </div>
            </div>
          </div>
        </div>
        {/* Button */}
        <div className="flex justify-center mt-10">
          <button
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3 px-12 rounded-xl font-bold text-lg shadow-lg hover:from-blue-700 hover:to-cyan-600 hover:scale-105 active:scale-100 transition"
            onClick={handleOrder}
          >
            Beauftragen
          </button>
        </div>
        {submitted && (
          <div className="success-message text-center text-lg">
            Bestellung wurde registriert.
          </div>
        )}
      </div>
    </div>
  );
}

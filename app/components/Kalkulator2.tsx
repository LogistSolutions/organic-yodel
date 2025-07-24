"use client";
import React, { useState } from "react";

// Dummy-Typen, kannst du übernehmen/erweitern
type KundeConfig = {
  labels: string[];
  palletUnits: number[];
  packagingMaterial: number[];
  packagingTime: number[];
  preise: {
    kmRateTable: number[][];
  };
  rechnung?: {
    firmenname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
};

type Props = { config: KundeConfig; kundennummer: string };

export default function Kalkulator2({ config, kundennummer }: Props) {
  const [itemCount, setItemCount] = useState<number | "">("");
  const [beschreibung, setBeschreibung] = useState("");

  return (
    <div className="main-container" style={{ maxWidth: 560, margin: "2rem auto", padding: 30 }}>
      <h1 style={{ textAlign: "center", marginBottom: 20, color: "#2563eb" }}>
        Mobiliar Kalkulator
      </h1>
      <div style={{ marginBottom: 12, color: "#3853af", textAlign: "center" }}>
        Kundennummer: <b>{kundennummer}</b>
      </div>

      <form style={{ margin: "0 auto", maxWidth: 420 }}>
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Anzahl Möbelstücke:</label>
          <input
            type="number"
            min="0"
            value={itemCount}
            onChange={e => setItemCount(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="z.B. 12"
            style={{
              width: "100%", padding: 10, fontSize: "1.1em", borderRadius: 6,
              border: "1.5px solid #d3e5f3", marginTop: 7
            }}
          />
        </div>

        <div style={{ marginBottom: 18 }}>
          <label style={{ fontWeight: 600 }}>Beschreibung:</label>
          <textarea
            value={beschreibung}
            onChange={e => setBeschreibung(e.target.value)}
            placeholder="Was soll abgeholt werden?"
            style={{
              width: "100%", minHeight: 56, fontSize: "1.1em", borderRadius: 6,
              border: "1.5px solid #d3e5f3", marginTop: 7, padding: 10, resize: "vertical"
            }}
          />
        </div>

        <div style={{ marginTop: 22, textAlign: "center" }}>
          <button
            type="button"
            style={{
              background: "#1b74e4",
              color: "#fff",
              border: "none",
              borderRadius: 7,
              fontWeight: 700,
              fontSize: "1.11em",
              padding: "13px 32px",
              cursor: "pointer",
              boxShadow: "0 2px 14px #2563eb23",
              marginRight: 8
            }}
            onClick={() => alert('Sende Anfrage – hier weitere Logik einbauen!')}
          >
            Anfrage absenden
          </button>
        </div>
      </form>
    </div>
  );
}
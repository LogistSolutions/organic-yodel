"use client";
import React, { useState } from "react";
import configJson from "../data/config.json";

type Kunde = {
  labels: string[];
  palletUnits: number[];
  packagingMaterial: number[];
  packagingTime: number[];
  preise: { kmRateTable: number[][] };
  auftraggeber?: {
    firmenname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
};

type Config = {
  kunden: { [kundennummer: string]: Kunde };
};

const initialConfig: Config = configJson as Config;
const ADMIN_PW = "GROSS";

function leeresKundeObjekt(): Kunde {
  return {
    labels: ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6"],
    palletUnits: [0, 0, 0, 0, 0, 0],
    packagingMaterial: [0, 0, 0, 0, 0, 0],
    packagingTime: [0, 0, 0, 0, 0, 0],
    preise: { kmRateTable: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
    auftraggeber: { firmenname: "", strasse: "", plz: "", ort: "", land: "" }
  }
}

export default function AdminPage() {
  const [eingeloggt, setEingeloggt] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [config, setConfig] = useState<Config>(initialConfig);
  const [neueKundennr, setNeueKundennr] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  const handleValueChange = (
    kundennummer: string,
    field: keyof Kunde,
    idx: number,
    value: string
  ) => {
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [kundennummer]: {
          ...prev.kunden[kundennummer],
          [field]: (prev.kunden[kundennummer][field] as any[]).map((v, i) =>
            i === idx ? (field === "labels" ? value : Number(value)) : v
          ),
        }
      }
    }));
  };

  const handleAuftraggeberChange = (
    kundennummer: string,
    subfield: string,
    value: string
  ) => {
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [kundennummer]: {
          ...prev.kunden[kundennummer],
          auftraggeber: {
            ...(prev.kunden[kundennummer].auftraggeber || {}),
            [subfield]: value,
          },
        },
      },
    }));
  };

  const handlePreisChange = (
    kundennummer: string,
    row: number,
    col: number,
    value: string
  ) => {
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [kundennummer]: {
          ...prev.kunden[kundennummer],
          preise: {
            ...prev.kunden[kundennummer].preise,
            kmRateTable: prev.kunden[kundennummer].preise.kmRateTable.map(
              (arr, rIdx) =>
                rIdx === row
                  ? arr.map((v, cIdx) =>
                      cIdx === col ? Number(value) : v
                    )
                  : arr
            )
          }
        }
      }
    }));
  };

  const handleDeleteKunde = (nr: string) => {
    if (!window.confirm(`Kunde ${nr} wirklich löschen?`)) return;
    setConfig(prev => {
      const neu = { ...prev.kunden };
      delete neu[nr];
      return { ...prev, kunden: neu };
    });
    setSelected(null);
  };

  const handleAddKunde = () => {
    if (!neueKundennr || config.kunden[neueKundennr]) {
      alert("Bitte eine eindeutige Kundennummer eingeben!");
      return;
    }
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [neueKundennr]: leeresKundeObjekt(),
      }
    }));
    setSelected(neueKundennr);
    setNeueKundennr("");
  };

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify(config, null, 2)],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Passwortschutz
  if (!eingeloggt) {
    return (
      <div className="main-container" style={{ maxWidth: 420, marginTop: 50 }}>
        <h1>Admin Login</h1>
        <form
          onSubmit={e => {
            e.preventDefault();
            if (pw === ADMIN_PW) {
              setEingeloggt(true);
              setPwError(false);
            } else {
              setPwError(true);
            }
          }}
        >
          <input
            type="password"
            placeholder="Admin-Passwort"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{
              width: "100%",
              marginBottom: 16,
              border: pwError ? "2px solid #f56b6b" : undefined,
              background: pwError ? "#fff0f0" : undefined,
            }}
          />
          <button type="submit" style={{ width: "100%" }}>
            Login
          </button>
          {pwError && (
            <div style={{ color: "#f56b6b", marginTop: 10 }}>
              Falsches Passwort!
            </div>
          )}
        </form>
      </div>
    );
  }

  // Übersicht & Detailansicht
  return (
    <div className="main-container" style={{ maxWidth: 1000, marginTop: 30 }}>
      <h1>Admin: Kundenverwaltung</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
        <input
          placeholder="Neue Kundennummer"
          value={neueKundennr}
          onChange={e => setNeueKundennr(e.target.value.replace(/[^0-9]/g, ""))}
          style={{ width: 160 }}
        />
        <button onClick={handleAddKunde} style={{
          background: "#1b74e4", color: "#fff", border: "none", borderRadius: 7,
          padding: "6px 14px", fontWeight: 600, fontSize: "1.06rem", cursor: "pointer"
        }}>
          Hinzufügen
        </button>
        <button onClick={handleExport} style={{ marginLeft: "auto" }}>
          Export als JSON
        </button>
      </div>

      {/* Kundenliste */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        marginBottom: 35
      }}>
        {Object.keys(config.kunden).map(nr => (
          <button
            key={nr}
            onClick={() => setSelected(nr)}
            style={{
              background: selected === nr ? "#2563eb" : "#f0f5fa",
              color: selected === nr ? "#fff" : "#222",
              fontWeight: 700,
              fontSize: "1.1rem",
              borderRadius: 13,
              border: selected === nr ? "2px solid #1b74e4" : "1px solid #d4e0ee",
              padding: "14px 28px",
              cursor: "pointer",
              boxShadow: selected === nr ? "0 2px 14px #2563eb23" : "none"
            }}
          >
            {nr}
          </button>
        ))}
      </div>

      {/* Details für ausgewählten Kunden */}
      {selected && config.kunden[selected] && (
        <div style={{
          background: "#f7fafd",
          borderRadius: 18,
          padding: 30,
          marginBottom: 30,
          boxShadow: "0 4px 24px #23365a12"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ color: "#2049a0", marginBottom: 8 }}>
              Kunde {selected} Details
            </h2>
            <button
              onClick={() => handleDeleteKunde(selected)}
              style={{
                background: "#f56b6b",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 22px",
                fontWeight: 700,
                fontSize: "1.05rem",
                cursor: "pointer",
                marginLeft: 16
              }}
            >
              Löschen
            </button>
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 26,
            marginTop: 12
          }}>
            {/* Labels und Paletten */}
            <div>
              <b>Labels & Paletten:</b>
              {config.kunden[selected].labels.map((label, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 5 }}>
                  <input
                    type="text"
                    value={label}
                    onChange={e => handleValueChange(selected, "labels", idx, e.target.value)}
                    style={{ width: 165 }}
                  />
                  <input
                    type="number"
                    value={config.kunden[selected].palletUnits[idx]}
                    onChange={e => handleValueChange(selected, "palletUnits", idx, e.target.value)}
                    style={{ width: 78 }}
                  />
                  <span style={{ color: "#7c8da2", fontSize: "0.96em" }}>
                    (Label, Paletten)
                  </span>
                </div>
              ))}
            </div>
            {/* Material und Verpackungszeit */}
            <div>
              <b>Material & Verpackungszeit:</b>
              {config.kunden[selected].packagingMaterial.map((mat, idx) => (
                <div key={idx} style={{ display: "flex", gap: 12, marginBottom: 5 }}>
                  <input
                    type="number"
                    step="0.01"
                    value={mat}
                    onChange={e => handleValueChange(selected, "packagingMaterial", idx, e.target.value)}
                    style={{ width: 78 }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={config.kunden[selected].packagingTime[idx]}
                    onChange={e => handleValueChange(selected, "packagingTime", idx, e.target.value)}
                    style={{ width: 78 }}
                  />
                  <span style={{ color: "#7c8da2", fontSize: "0.96em" }}>
                    (Material, Zeit)
                  </span>
                </div>
              ))}
            </div>
            {/* Preise */}
            <div style={{ gridColumn: "1 / -1", marginTop: 12 }}>
              <b>kmRateTable:</b>
              <div style={{ overflowX: "auto", marginTop: 6 }}>
                <table style={{ borderCollapse: "collapse", minWidth: 440 }}>
                  <thead>
                    <tr>
                      <th></th>
                      {config.kunden[selected].labels.map((l, cIdx) => (
                        <th key={cIdx} style={{ textAlign: "center", fontWeight: 600, color: "#2049a0", padding: 4, fontSize: "0.96em" }}>
                          Typ {cIdx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["1-2 Paletten", "3 Paletten", "4-6 Paletten", "7+ Paletten"].map((rowName, rIdx) => (
                      <tr key={rIdx}>
                        <td style={{ fontWeight: 600, color: "#4a6fb3", paddingRight: 9 }}>{rowName}</td>
                        {config.kunden[selected].preise.kmRateTable[rIdx].map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "3px 7px" }}>
                            <input
                              type="number"
                              step="0.01"
                              value={cell}
                              onChange={e => handlePreisChange(selected, rIdx, cIdx, e.target.value)}
                              style={{ width: 54 }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Auftraggeber */}
            <div style={{ gridColumn: "1 / -1", marginTop: 20, marginBottom: 8 }}>
              <b>Auftraggeber:</b>
              <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", rowGap: 12, columnGap: 15, alignItems: "center", marginTop: 10 }}>
                <span style={{ fontWeight: 500 }}>Firmenname:</span>
                <input
                  type="text"
                  value={config.kunden[selected].auftraggeber?.firmenname || ""}
                  onChange={e => handleAuftraggeberChange(selected, "firmenname", e.target.value)}
                  style={{ width: "100%", minWidth: 180, fontSize: "1.13em", padding: "7px 10px" }}
                />
                <span style={{ fontWeight: 500 }}>Straße:</span>
                <input
                  type="text"
                  value={config.kunden[selected].auftraggeber?.strasse || ""}
                  onChange={e => handleAuftraggeberChange(selected, "strasse", e.target.value)}
                  style={{ width: "100%", minWidth: 180, fontSize: "1.13em", padding: "7px 10px" }}
                />
                <span style={{ fontWeight: 500 }}>PLZ:</span>
                <input
                  type="text"
                  value={config.kunden[selected].auftraggeber?.plz || ""}
                  onChange={e => handleAuftraggeberChange(selected, "plz", e.target.value)}
                  style={{ width: "100%", minWidth: 100, fontSize: "1.13em", padding: "7px 10px" }}
                />
                <span style={{ fontWeight: 500 }}>Ort:</span>
                <input
                  type="text"
                  value={config.kunden[selected].auftraggeber?.ort || ""}
                  onChange={e => handleAuftraggeberChange(selected, "ort", e.target.value)}
                  style={{ width: "100%", minWidth: 140, fontSize: "1.13em", padding: "7px 10px" }}
                />
                <span style={{ fontWeight: 500 }}>Land:</span>
                <input
                  type="text"
                  value={config.kunden[selected].auftraggeber?.land || ""}
                  onChange={e => handleAuftraggeberChange(selected, "land", e.target.value)}
                  style={{ width: "100%", minWidth: 140, fontSize: "1.13em", padding: "7px 10px" }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState } from "react";
import configJson from "../data/config.json";

type Adresse = {
  firmenname?: string;
  strasse?: string;
  plz?: string;
  ort?: string;
  land?: string;
};

type Kalkulator = {
  id: string;
  bezeichnung: string;
};

type Kunde = {
  labels: string[];
  palletUnits: number[];
  packagingMaterial: number[];
  packagingTime: number[];
  preise: { kmRateTable: number[][] };
  rechnung?: Adresse;
  abholadresse?: Adresse;
  lieferadresse?: Adresse;
  lieferadresse_abweichend?: boolean;
  kalkulatoren?: Kalkulator[];
};

type Config = {
  kunden: { [kundennummer: string]: Kunde };
};

const ALL_KALKULATOREN = [
  { id: "Kalkulator", defaultLabel: "IT Assetpreis-Kalkulator" },
  { id: "Kalkulator2", defaultLabel: "Mobiliar Kalkulator" }
];

const initialConfig: Config = configJson as Config;
const ADMIN_PW = "GROSS";

function leeresKundeObjekt(): Kunde {
  return {
    labels: ["Label 1", "Label 2", "Label 3", "Label 4", "Label 5", "Label 6"],
    palletUnits: [0, 0, 0, 0, 0, 0],
    packagingMaterial: [0, 0, 0, 0, 0, 0],
    packagingTime: [0, 0, 0, 0, 0, 0],
    preise: { kmRateTable: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]] },
    rechnung: { firmenname: "", strasse: "", plz: "", ort: "", land: "" },
    abholadresse: { firmenname: "", strasse: "", plz: "", ort: "", land: "" },
    lieferadresse: { firmenname: "", strasse: "", plz: "", ort: "", land: "" },
    lieferadresse_abweichend: false,
    kalkulatoren: []
  }
}

export default function AdminPage() {
  const [eingeloggt, setEingeloggt] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [config, setConfig] = useState<Config>(initialConfig);
  const [neueKundennr, setNeueKundennr] = useState("");
  const [selected, setSelected] = useState<string | null>(null);

  // Kalkulatoren Handling
  function handleKalkulatorCheck(kundennummer: string, kalkId: string, checked: boolean) {
    setConfig(prev => {
      const kunde = prev.kunden[kundennummer];
      let neueKalks = Array.isArray(kunde.kalkulatoren) ? [...kunde.kalkulatoren] : [];
      if (checked) {
        if (!neueKalks.find(k => k.id === kalkId)) {
          const defaultName = ALL_KALKULATOREN.find(k => k.id === kalkId)?.defaultLabel || kalkId;
          neueKalks.push({ id: kalkId, bezeichnung: defaultName });
        }
      } else {
        neueKalks = neueKalks.filter(k => k.id !== kalkId);
      }
      return {
        ...prev,
        kunden: {
          ...prev.kunden,
          [kundennummer]: {
            ...kunde,
            kalkulatoren: neueKalks
          }
        }
      }
    });
  }
  function handleKalkulatorBezeichnung(kundennummer: string, kalkId: string, val: string) {
    setConfig(prev => {
      const kunde = prev.kunden[kundennummer];
      const neueKalks = (kunde.kalkulatoren || []).map(k =>
        k.id === kalkId ? { ...k, bezeichnung: val } : k
      );
      return {
        ...prev,
        kunden: {
          ...prev.kunden,
          [kundennummer]: {
            ...kunde,
            kalkulatoren: neueKalks
          }
        }
      }
    });
  }

  // Adress Handling
  function handleAdresseChange(kundennummer: string, art: "rechnung"|"abholadresse"|"lieferadresse", subfield: keyof Adresse, value: string) {
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [kundennummer]: {
          ...prev.kunden[kundennummer],
          [art]: {
            ...(prev.kunden[kundennummer][art] || {}),
            [subfield]: value,
          }
        }
      }
    }));
  }
  function handleLieferAbweichendChange(kundennummer: string, abweichend: boolean) {
    setConfig(prev => ({
      ...prev,
      kunden: {
        ...prev.kunden,
        [kundennummer]: {
          ...prev.kunden[kundennummer],
          lieferadresse_abweichend: abweichend
        }
      }
    }));
  }

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
      { type: "application/json;charset=utf-8" }
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
        <div className="admin-details">
          <div style={{ width: "100%", textAlign: "center" }}>
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

          <div className="admin-section-title">Labels & Paletten</div>
          {config.kunden[selected].labels.map((label, idx) => (
            <div className="admin-form-row" key={idx}>
              <label>Label {idx + 1}:</label>
              <input
                type="text"
                value={label}
                onChange={e => handleValueChange(selected, "labels", idx, e.target.value)}
              />
              <label>Paletten:</label>
              <input
                type="number"
                value={config.kunden[selected].palletUnits[idx]}
                onChange={e => handleValueChange(selected, "palletUnits", idx, e.target.value)}
              />
            </div>
          ))}

          <div className="admin-section-title">Material & Verpackungszeit</div>
          {config.kunden[selected].packagingMaterial.map((mat, idx) => (
            <div className="admin-form-row" key={idx}>
              <label>Material {idx + 1}:</label>
              <input
                type="number"
                step="0.01"
                value={mat}
                onChange={e => handleValueChange(selected, "packagingMaterial", idx, e.target.value)}
              />
              <label>Zeit:</label>
              <input
                type="number"
                step="0.01"
                value={config.kunden[selected].packagingTime[idx]}
                onChange={e => handleValueChange(selected, "packagingTime", idx, e.target.value)}
              />
            </div>
          ))}

          <div className="admin-section-title">kmRateTable</div>
          <div style={{ overflowX: "auto", marginTop: 6 }}>
            <table style={{ borderCollapse: "collapse", minWidth: 440, margin: "0 auto" }}>
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

          <div className="admin-section-title">Rechnungsadresse</div>
          {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
            <div className="admin-form-row" key={field}>
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              <input
                type="text"
                value={config.kunden[selected].rechnung?.[field as keyof Adresse] || ""}
                onChange={e => handleAdresseChange(selected, "rechnung", field as keyof Adresse, e.target.value)}
              />
            </div>
          ))}

          <div className="admin-section-title">Abholadresse</div>
          {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
            <div className="admin-form-row" key={field}>
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
              <input
                type="text"
                value={config.kunden[selected].abholadresse?.[field as keyof Adresse] || ""}
                onChange={e => handleAdresseChange(selected, "abholadresse", field as keyof Adresse, e.target.value)}
              />
            </div>
          ))}
          <div className="admin-section-title">Lieferadresse</div>
          <div className="liefer-checkbox-row">
            <input
              type="checkbox"
              checked={config.kunden[selected].lieferadresse_abweichend || false}
              onChange={e => handleLieferAbweichendChange(selected, e.target.checked)}
              id="lieferadresse_abweichend"
              className="liefer-checkbox"
            />
            <label htmlFor="lieferadresse_abweichend" className="liefer-checkbox-label">
              Abweichende Ziel-Adresse (optional)
            </label>
          </div>
          {config.kunden[selected].lieferadresse_abweichend && (
            <>
              {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
                <div className="admin-form-row" key={field}>
                  <label>{field.charAt(0).toUpperCase() + field.slice(1)}:</label>
                  <input
                    type="text"
                    value={config.kunden[selected].lieferadresse?.[field as keyof Adresse] || ""}
                    onChange={e => handleAdresseChange(selected, "lieferadresse", field as keyof Adresse, e.target.value)}
                  />
                </div>
              ))}
            </>
          )}

          <div className="admin-section-title">Kalkulatoren freischalten:</div>
          <div className="kalkulatoren-list">
            {ALL_KALKULATOREN.map(kalk => {
              const istAktiv = (config.kunden[selected].kalkulatoren || []).some(k => k.id === kalk.id);
              const bezeichnung = (config.kunden[selected].kalkulatoren || []).find(k => k.id === kalk.id)?.bezeichnung || kalk.defaultLabel;
              return (
                <div key={kalk.id} className="kalk-row">
                  <label className="kalk-checkbox-label">
                    <input
                      type="checkbox"
                      checked={istAktiv}
                      onChange={e => handleKalkulatorCheck(selected, kalk.id, e.target.checked)}
                      id={`kalk-${selected}-${kalk.id}`}
                      className="kalk-checkbox"
                    />
                    <span className="kalk-label">{kalk.defaultLabel}</span>
                  </label>
                  {istAktiv && (
                    <input
                      type="text"
                      value={bezeichnung}
                      onChange={e => handleKalkulatorBezeichnung(selected, kalk.id, e.target.value)}
                      placeholder="Kachel-Beschriftung"
                      className="kalk-beschriftung"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

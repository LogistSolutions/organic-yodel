"use client";
import React, { useState } from "react";
import configJson from "../data/config.json";

type Adresse = { firmenname?: string; strasse?: string; plz?: string; ort?: string; land?: string; };
type Kalkulator = { id: string; bezeichnung: string; };
type Preise = { kmRateTable?: number[][]; mengenStaffel?: any[] };
type Staffel = { von: number; bis: number; preis: number; art: string; bemerkung?: string };

type Kunde = {
  rechnung?: Adresse;
  abholadresse?: Adresse;
  lieferadresse_abweichend?: boolean;
  lieferadresse?: Adresse;
  kalkulatoren?: Kalkulator[];
  labels?: string[];
  palletUnits?: number[];
  packagingMaterial?: number[];
  packagingTime?: number[];
  preise?: Preise;
  staffeln?: Staffel[][];
};

type Config = { kunden: { [kundennummer: string]: Kunde } };
const initialConfig: Config = configJson as Config;

const ALL_KALKULATOREN = [
  { id: "Kalkulator", defaultLabel: "IT Assetpreis-Kalkulator" },
  { id: "Kalkulator2", defaultLabel: "Stueckpreis-Kalkulator" }
];

const ADMIN_PW = "GROSS";

export default function AdminPage() {
  const [eingeloggt, setEingeloggt] = useState(false);
  const [pw, setPw] = useState("");
  const [pwError, setPwError] = useState(false);

  const [config, setConfig] = useState<Config>(initialConfig);
  const [neueKundennr, setNeueKundennr] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [editKunde, setEditKunde] = useState<Kunde | null>(null);
  const [activeTab, setActiveTab] = useState<string>("Kalkulator");

  // Kundenwechsel robust
  React.useEffect(() => {
    if (selected && config.kunden[selected]) {
      // Fallbacks für "leere" oder ältere Kunden
      const kunde = config.kunden[selected];
      setEditKunde({
        ...kunde,
        labels: Array.isArray(kunde.labels) ? kunde.labels : ["", "", "", "", "", ""],
        palletUnits: Array.isArray(kunde.palletUnits) ? kunde.palletUnits : [0,0,0,0,0,0],
        packagingMaterial: Array.isArray(kunde.packagingMaterial) ? kunde.packagingMaterial : [0,0,0,0,0,0],
        packagingTime: Array.isArray(kunde.packagingTime) ? kunde.packagingTime : [0,0,0,0,0,0],
        preise: kunde.preise ?? { kmRateTable: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]], mengenStaffel: [] },
        staffeln: Array.isArray(kunde.staffeln) ? kunde.staffeln : [[],[],[],[],[],[]]
      });
      setActiveTab(kunde.kalkulatoren?.[0]?.id ?? "Kalkulator");
    }
  }, [selected, config]);

  // ---------- Edit Handlers ----------
  function handleFeldChange(field: keyof Kunde, value: any) {
    setEditKunde(prev =>
      prev ? { ...prev, [field]: value } : prev
    );
  }
  function handleArrayChange(field: keyof Kunde, idx: number, value: any) {
    setEditKunde(prev => {
      if (!prev || !Array.isArray(prev[field])) return prev;
      const arr = [...(prev[field] as any[])];
      arr[idx] = value;
      return { ...prev, [field]: arr };
    });
  }
  function handleAdresseChange(type: keyof Kunde, sub: keyof Adresse, val: string) {
  setEditKunde(prev => ({
    ...prev!,
    [type]: {
      ...((prev && typeof prev[type] === "object" && prev[type] !== null) ? prev[type] : {}),
      [sub]: val
    }
  }));
}

  function handleKalkulatorCheck(kalkId: string, checked: boolean) {
    setEditKunde(prev => {
      if (!prev) return prev;
      let neueKalks = Array.isArray(prev.kalkulatoren) ? [...prev.kalkulatoren] : [];
      if (checked) {
        if (!neueKalks.find(k => k.id === kalkId)) {
          const defaultName = ALL_KALKULATOREN.find(k => k.id === kalkId)?.defaultLabel || kalkId;
          neueKalks.push({ id: kalkId, bezeichnung: defaultName });
        }
      } else {
        neueKalks = neueKalks.filter(k => k.id !== kalkId);
      }
      return { ...prev, kalkulatoren: neueKalks };
    });
  }
  function handleKalkulatorBezeichnung(kalkId: string, val: string) {
    setEditKunde(prev => {
      if (!prev || !Array.isArray(prev.kalkulatoren)) return prev;
      const neueKalks = prev.kalkulatoren.map(k =>
        k.id === kalkId ? { ...k, bezeichnung: val } : k
      );
      return { ...prev, kalkulatoren: neueKalks };
    });
  }

  function handleSaveKunde() {
    if (!selected || !editKunde) return;
    setConfig(prev => ({
      ...prev,
      kunden: { ...prev.kunden, [selected]: editKunde }
    }));
    alert("Kunde gespeichert.");
  }
  function handleDeleteKunde(nr: string) {
    if (!window.confirm(`Kunde ${nr} wirklich löschen?`)) return;
    setConfig(prev => {
      const neu = { ...prev.kunden };
      delete neu[nr];
      return { ...prev, kunden: neu };
    });
    setSelected(null);
    setEditKunde(null);
  }
  function handleAddKunde() {
    if (!neueKundennr || config.kunden[neueKundennr]) {
      alert("Bitte eine eindeutige Kundennummer eingeben!");
      return;
    }
    const leer: Kunde = {
      rechnung: {}, abholadresse: {}, lieferadresse: {},
      labels: ["", "", "", "", "", ""],
      palletUnits: [0,0,0,0,0,0],
      packagingMaterial: [0,0,0,0,0,0],
      packagingTime: [0,0,0,0,0,0],
      preise: { kmRateTable: [[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]], mengenStaffel: [] },
      kalkulatoren: [{ id: "Kalkulator", bezeichnung: "IT Assetpreis-Kalkulator" }],
      staffeln: [[],[],[],[],[],[]]
    };
    setConfig(prev => ({
      ...prev,
      kunden: { ...prev.kunden, [neueKundennr]: leer }
    }));
    setSelected(neueKundennr);
    setNeueKundennr("");
  }
  function handleExport() {
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "config.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Passwortschutz
  if (!eingeloggt) {
    return (
      <div style={{ maxWidth: 420, margin: "60px auto", textAlign: "center" }}>
        <h1>Admin Login</h1>
        <form onSubmit={e => {
          e.preventDefault();
          if (pw === ADMIN_PW) {
            setEingeloggt(true);
            setPwError(false);
          } else {
            setPwError(true);
          }
        }}>
          <input
            type="password"
            placeholder="Admin-Passwort"
            value={pw}
            onChange={e => setPw(e.target.value)}
            style={{ width: "100%", marginBottom: 16, border: pwError ? "2px solid #f56b6b" : undefined, background: pwError ? "#fff0f0" : undefined }}
          />
          <button type="submit" style={{ width: "100%" }}>Login</button>
          {pwError && <div style={{ color: "#f56b6b", marginTop: 10 }}>Falsches Passwort!</div>}
        </form>
      </div>
    );
  }

  // ---- UI START
  return (
    <div className="main-container" style={{ maxWidth: 1080, margin: "40px auto 32px auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: 22, letterSpacing: 0.5, color: "#1b3776" }}>Admin: Kundenverwaltung</h1>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
        <input
          placeholder="Neue Kundennummer"
          value={neueKundennr}
          onChange={e => setNeueKundennr(e.target.value.replace(/[^0-9]/g, ""))}
          style={{ width: 160 }}
        />
        <button onClick={handleAddKunde} style={{
          background: "#1b74e4", color: "#fff", border: "none", borderRadius: 7,
          padding: "7px 18px", fontWeight: 600, fontSize: "1.07rem", cursor: "pointer"
        }}>Hinzufügen</button>
        <button onClick={handleExport} style={{ marginLeft: "auto" }}>Export als JSON</button>
      </div>
      {/* Kundenliste */}
      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 18,
        marginBottom: 30
      }}>
        {Object.keys(config.kunden).map(nr => (
          <button
            key={nr}
            onClick={() => setSelected(nr)}
            style={{
              background: selected === nr ? "#2563eb" : "#f0f5fa",
              color: selected === nr ? "#fff" : "#222",
              fontWeight: 700,
              fontSize: "1.08rem",
              borderRadius: 13,
              border: selected === nr ? "2px solid #1b74e4" : "1px solid #d4e0ee",
              padding: "14px 26px",
              cursor: "pointer",
              boxShadow: selected === nr ? "0 2px 14px #2563eb23" : "none"
            }}>
            {nr}
          </button>
        ))}
      </div>
      {/* Kundendetails */}
      {selected && editKunde && (
        <div style={{ background: "#f7fafd", borderRadius: 18, padding: "30px 22px", marginBottom: 30, boxShadow: "0 4px 24px #23365a12" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ color: "#2049a0", marginBottom: 8, letterSpacing: 0.2 }}>Kunde {selected} Details</h2>
            <button onClick={() => handleDeleteKunde(selected)}
              style={{
                background: "#f56b6b", color: "#fff", border: "none",
                borderRadius: 8, padding: "8px 22px", fontWeight: 700,
                fontSize: "1.05rem", cursor: "pointer", marginLeft: 16
              }}>
              Löschen
            </button>
          </div>
          {/* Kalkulatoren-Auswahl */}
          <div style={{ margin: "20px 0 22px 0" }}>
            <div style={{ fontWeight: 600, color: "#185399", fontSize: "1.10em" }}>
              Kalkulatoren freischalten:
            </div>
            <div style={{ marginTop: 9, display: "flex", gap: 18 }}>
              {ALL_KALKULATOREN.map(kalk => {
                const istAktiv = (editKunde.kalkulatoren || []).some(k => k.id === kalk.id);
                const bezeichnung = (editKunde.kalkulatoren || []).find(k => k.id === kalk.id)?.bezeichnung || kalk.defaultLabel;
                return (
                  <div key={kalk.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox"
                      checked={istAktiv}
                      onChange={e => handleKalkulatorCheck(kalk.id, e.target.checked)}
                      id={`kalk-${selected}-${kalk.id}`}
                      style={{ width: 18, height: 18 }}
                    />
                    <label htmlFor={`kalk-${selected}-${kalk.id}`} style={{ minWidth: 130 }}>{kalk.defaultLabel}</label>
                    {istAktiv && (
                      <input type="text" value={bezeichnung}
                        onChange={e => handleKalkulatorBezeichnung(kalk.id, e.target.value)}
                        style={{ marginLeft: 4, width: 220, fontWeight: 500 }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {/* Tabs für Kalkulatoren */}
          <div style={{ marginTop: 30 }}>
            {(editKunde.kalkulatoren || []).map(kalk => (
              <button
                key={kalk.id}
                onClick={() => setActiveTab(kalk.id)}
                style={{
                  background: activeTab === kalk.id ? "#1652b9" : "#edf4fa",
                  color: activeTab === kalk.id ? "#fff" : "#2059a2",
                  fontWeight: 700, fontSize: "1.03em", padding: "10px 28px",
                  borderRadius: 14, border: "none", marginRight: 10, marginBottom: 12, cursor: "pointer"
                }}>
                {kalk.bezeichnung || kalk.id}
              </button>
            ))}
          </div>
          {/* Felder pro Kalkulator */}
          {activeTab === "Kalkulator" && (
            <div>
              <h3 style={{ color: "#234890", fontWeight: 700, marginTop: 22, marginBottom: 12, fontSize: "1.18em" }}>IT Assetpreis-Kalkulator Werte</h3>
              {editKunde.labels?.map((label, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <input type="text"
                    value={label}
                    onChange={e => handleArrayChange("labels", idx, e.target.value)}
                    style={{ width: 170, fontSize: "1.01em" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={editKunde.palletUnits?.[idx] ?? ""}
                    onChange={e => handleArrayChange("palletUnits", idx, e.target.value.replace(",", "."))}
                    style={{ width: 70, fontSize: "0.93em" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={editKunde.packagingMaterial?.[idx] ?? ""}
                    onChange={e => handleArrayChange("packagingMaterial", idx, e.target.value.replace(",", "."))}
                    style={{ width: 70, fontSize: "0.93em" }}
                  />
                  <input
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9.,]*"
                    value={editKunde.packagingTime?.[idx] ?? ""}
                    onChange={e => handleArrayChange("packagingTime", idx, e.target.value.replace(",", "."))}
                    style={{ width: 70, fontSize: "0.93em" }}
                  />
                </div>
              ))}
              <div style={{ marginTop: 20, fontWeight: 600, color: "#144077" }}>kmRateTable:</div>
              <div style={{ overflowX: "auto", marginTop: 5 }}>
                <table style={{ borderCollapse: "collapse", minWidth: 530, fontSize: "0.90em" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: 6 }}>Stufe</th>
                      {editKunde.labels?.map((_, cIdx) => (
                        <th key={cIdx} style={{ padding: 6 }}>Typ {cIdx + 1}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {["1-2 Paletten", "3 Paletten", "4-6 Paletten", "7+ Paletten"].map((rowName, rIdx) => (
                      <tr key={rIdx}>
                        <td style={{ fontWeight: 600, color: "#4a6fb3", paddingRight: 8 }}>{rowName}</td>
                        {editKunde.preise?.kmRateTable?.[rIdx]?.map((cell, cIdx) => (
                          <td key={cIdx} style={{ padding: "2px 8px" }}>
                            <input
                              type="text"
                              inputMode="decimal"
                              pattern="[0-9.,]*"
                              value={cell}
                              onChange={e => {
                                const arr = editKunde.preise?.kmRateTable?.map(a => [...a]) ?? [[], [], [], []];
                                arr[rIdx][cIdx] = Number(e.target.value.replace(",", "."));
                                handleFeldChange("preise", { ...editKunde.preise, kmRateTable: arr });
                              }}
                              style={{
                                width: 60, fontSize: "0.88em", background: "#fff",
                                border: "1px solid #bbb", borderRadius: 5, padding: "4px 7px"
                              }}
                            />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
          {activeTab === "Kalkulator2" && (
            <div>
              <h3 style={{ color: "#248184", fontWeight: 700, marginTop: 22, marginBottom: 12, fontSize: "1.13em" }}>
                Stueckpreis-Kalkulator – Mengenstaffeln
              </h3>
              {(editKunde.staffeln ?? [[],[],[],[],[],[]]).map((reihe, labelIdx) => (
                <div key={labelIdx} style={{ marginBottom: 14 }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, color: "#1c4c64" }}>
                    {editKunde.labels?.[labelIdx] || `Typ ${labelIdx+1}`}
                  </div>
                  <table style={{ borderCollapse: "collapse", width: "100%", marginBottom: 5 }}>
                    <thead>
                      <tr style={{ background: "#e7f7f7", color: "#134b4c", fontSize: "0.55em" }}>
                        <th>Von</th>
                        <th>Bis</th>
                        <th>Preis (€)</th>
                        <th>Art</th>
                        <th>Bemerkung</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {(reihe ?? []).map((staffel, idx) => (
                        <tr key={idx}>
                          <td>
                            <input type="number" value={staffel.von ?? ""}
                              onChange={e => {
                                const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                                arr[idx] = { ...arr[idx], von: Number(e.target.value) };
                                const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                                neuStaffeln[labelIdx] = arr;
                                handleFeldChange("staffeln", neuStaffeln);
                              }}
                              style={{ width: 48, fontSize: "0.63em" }} />
                          </td>
                          <td>
                            <input type="number" value={staffel.bis ?? ""}
                              onChange={e => {
                                const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                                arr[idx] = { ...arr[idx], bis: Number(e.target.value) };
                                const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                                neuStaffeln[labelIdx] = arr;
                                handleFeldChange("staffeln", neuStaffeln);
                              }}
                              style={{ width: 48, fontSize: "0.63em" }} />
                          </td>
                          <td>
                            <input type="number" value={staffel.preis ?? ""}
                              onChange={e => {
                                const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                                arr[idx] = { ...arr[idx], preis: Number(e.target.value) };
                                const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                                neuStaffeln[labelIdx] = arr;
                                handleFeldChange("staffeln", neuStaffeln);
                              }}
                              style={{ width: 70, fontSize: "0.63em" }} />
                          </td>
                          <td>
                            <select value={staffel.art ?? "Pauschale"} onChange={e => {
                              const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                              arr[idx] = { ...arr[idx], art: e.target.value };
                              const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                              neuStaffeln[labelIdx] = arr;
                              handleFeldChange("staffeln", neuStaffeln);
                            }} style={{ fontSize: "0.64em" }}>
                              <option value="Pauschale">Pauschale</option>
                              <option value="Stückpreis">Stückpreis</option>
                            </select>
                          </td>
                          <td>
                            <input type="text" value={staffel.bemerkung ?? ""}
                              onChange={e => {
                                const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                                arr[idx] = { ...arr[idx], bemerkung: e.target.value };
                                const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                                neuStaffeln[labelIdx] = arr;
                                handleFeldChange("staffeln", neuStaffeln);
                              }}
                              style={{ width: 115, fontSize: "0.63em" }} />
                          </td>
                          <td>
                            <button type="button" title="Löschen" onClick={() => {
                              const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                              arr.splice(idx, 1);
                              const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                              neuStaffeln[labelIdx] = arr;
                              handleFeldChange("staffeln", neuStaffeln);
                            }} style={{
                              background: "#f56b6b", color: "#fff", border: "none",
                              borderRadius: 5, padding: "2px 9px", marginLeft: 2, cursor: "pointer"
                            }}>×</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" style={{
                    background: "#1b74e4", color: "#fff", border: "none", borderRadius: 8,
                    padding: "6px 17px", fontWeight: 700, fontSize: "1.06em", cursor: "pointer"
                  }}
                    onClick={() => {
                      const arr = [...(editKunde.staffeln?.[labelIdx] ?? [])];
                      arr.push({ von: 1, bis: 1, preis: 0, art: "Pauschale", bemerkung: "" });
                      const neuStaffeln = [...(editKunde.staffeln ?? [[],[],[],[],[],[]])];
                      neuStaffeln[labelIdx] = arr;
                      handleFeldChange("staffeln", neuStaffeln);
                    }}>
                    + Staffel hinzufügen
                  </button>
                </div>
              ))}
            </div>
          )}
          {/* Adressfelder */}
          <div style={{ marginTop: 34, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <div>
              <div style={{ fontWeight: 600, color: "#1b3776", marginBottom: 4 }}>Rechnungsadresse:</div>
              {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
                <div key={field} style={{ marginBottom: 6 }}>
                  <input
                    type="text"
                    value={editKunde.rechnung?.[field as keyof Adresse] ?? ""}
                    onChange={e => handleAdresseChange("rechnung", field as keyof Adresse, e.target.value)}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    style={{ width: "96%", padding: "7px", fontSize: "1.04em", marginBottom: 2 }}
                  />
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontWeight: 600, color: "#1b3776", marginBottom: 4 }}>Abholadresse:</div>
              {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
                <div key={field} style={{ marginBottom: 6 }}>
                  <input
                    type="text"
                    value={editKunde.abholadresse?.[field as keyof Adresse] ?? ""}
                    onChange={e => handleAdresseChange("abholadresse", field as keyof Adresse, e.target.value)}
                    placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                    style={{ width: "96%", padding: "7px", fontSize: "1.04em", marginBottom: 2 }}
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <input
              type="checkbox"
              checked={editKunde.lieferadresse_abweichend || false}
              onChange={e => handleFeldChange("lieferadresse_abweichend", e.target.checked)}
              id="lieferadresse_abweichend"
            />
            <label htmlFor="lieferadresse_abweichend" style={{
              fontWeight: 600, color: "#1755a2", marginLeft: 9, fontSize: "1.06em"
            }}>Abweichende Lieferadresse?</label>
            {editKunde.lieferadresse_abweichend && (
              <div style={{ marginTop: 12 }}>
                {["firmenname", "strasse", "plz", "ort", "land"].map(field => (
                  <div key={field} style={{ marginBottom: 6 }}>
                    <input
                      type="text"
                      value={editKunde.lieferadresse?.[field as keyof Adresse] ?? ""}
                      onChange={e => handleAdresseChange("lieferadresse", field as keyof Adresse, e.target.value)}
                      placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
                      style={{ width: "92%", padding: "7px", fontSize: "1.04em" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Speichern/Übernehmen Button */}
          <div style={{ marginTop: 32, display: "flex", justifyContent: "center", gap: 24 }}>
            <button
              onClick={handleSaveKunde}
              style={{
                background: "#1956e2", color: "#fff", fontWeight: 700,
                fontSize: "1.13em", padding: "12px 48px",
                border: "none", borderRadius: 13,
                boxShadow: "0 3px 12px #1956e224", cursor: "pointer"
              }}>
              Übernehmen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

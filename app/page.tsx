"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import configJson from "./data/config.json";

// Typen
type Kunde = {
  rechnung?: {
    firmenname?: string;
    strasse?: string;
    plz?: string;
    ort?: string;
    land?: string;
  };
  kalkulatoren?: { id: string; bezeichnung: string }[];
};

type Config = {
  kunden: { [kundennummer: string]: Kunde };
};

const config: Config = configJson as Config;

export default function LandingPage() {
  const router = useRouter();
  const [step, setStep] = useState<"kundennr" | "plz" | "auswahl">("kundennr");
  const [inputNr, setInputNr] = useState("");
  const [inputPlz, setInputPlz] = useState("");
  const [kunde, setKunde] = useState<Kunde | null>(null);
  const [error, setError] = useState("");

  // 1. Kundennummer prüfen
  const handleKundennr = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Sonderfall: admin shortcut (06081968)
    if (inputNr.trim() === "06081968") {
      router.push("/admin");
      return;
    }

    if (!inputNr.trim()) {
      setError("Bitte Kundennummer eingeben.");
      return;
    }
    const k = config.kunden[inputNr.trim()];
    if (!k) {
      setError("Kundennummer nicht gefunden!");
      return;
    }
    setKunde(k);
    setStep("plz");
  };

  // 2. PLZ prüfen
  const handlePlz = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!inputPlz.trim()) {
      setError("Bitte Postleitzahl eingeben.");
      return;
    }
    if (kunde?.rechnung?.plz !== inputPlz.trim()) {
      setError("Postleitzahl stimmt nicht.");
      return;
    }
    if (!kunde.kalkulatoren || kunde.kalkulatoren.length === 0) {
      setError("Für Sie ist kein Kalkulator freigeschaltet.");
      return;
    }
    if (kunde.kalkulatoren.length === 1) {
      const kid = kunde.kalkulatoren[0].id;
      router.push(`/kalkulator/${kid}?kundennr=${inputNr.trim()}`);
    } else {
      setStep("auswahl");
    }
  };

  // 3. Kalkulator-Kachel-Klick
  const handleKachelClick = (kalkId: string) => {
    router.push(`/kalkulator/${kalkId}?kundennr=${inputNr.trim()}`);
  };

  return (
    <div className="main-container" style={{ maxWidth: 440, marginTop: 40 }}>
      <h1>Kalkulator Login</h1>
      {step === "kundennr" && (
        <form onSubmit={handleKundennr}>
          <label style={{ fontWeight: 600, marginBottom: 10, display: "block" }}>
            Kundennummer:
          </label>
          <input
            type="text"
            value={inputNr}
            onChange={e => setInputNr(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Ihre Kundennummer"
            style={{ width: "100%", fontSize: "1.13em", marginBottom: 20 }}
            autoFocus
          />
          <button type="submit" style={{ width: "100%" }}>Weiter</button>
          {error && <div style={{ color: "#c70025", marginTop: 13 }}>{error}</div>}
        </form>
      )}

      {step === "plz" && kunde && (
        <form onSubmit={handlePlz}>
          <div style={{ fontWeight: 600, fontSize: "1.04em", marginBottom: 14 }}>
            Bitte zur Verifizierung die Postleitzahl Ihrer Firma eingeben:
          </div>
          <input
            type="text"
            value={inputPlz}
            onChange={e => setInputPlz(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="Postleitzahl"
            style={{ width: "100%", fontSize: "1.12em", marginBottom: 20 }}
            autoFocus
          />
          <button type="submit" style={{ width: "100%" }}>Verifizieren</button>
          <div style={{ marginTop: 16, fontSize: "0.98em", color: "#3853af" }}>
            Firma: <b>{kunde.rechnung?.firmenname || ""}</b>
          </div>
          {error && <div style={{ color: "#c70025", marginTop: 13 }}>{error}</div>}
        </form>
      )}

      {step === "auswahl" && kunde && (
        <div style={{ marginTop: 20 }}>
          <h2 style={{ fontWeight: 700, fontSize: "1.19em", marginBottom: 16, color: "#17407b" }}>
            Bitte wählen Sie Ihren Kalkulator:
          </h2>
          <div style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 22,
            marginTop: 18,
            justifyContent: "center"
          }}>
            {kunde.kalkulatoren!.map(kalk => (
              <div
                key={kalk.id}
                onClick={() => handleKachelClick(kalk.id)}
                style={{
                  background: "#f7fafd",
                  border: "2.2px solid #1b74e4",
                  borderRadius: 17,
                  padding: "36px 36px",
                  minWidth: 210,
                  minHeight: 74,
                  fontSize: "1.18em",
                  fontWeight: 700,
                  color: "#2059a2",
                  cursor: "pointer",
                  boxShadow: "0 2px 16px #2174e418",
                  textAlign: "center",
                  transition: "transform .14s, box-shadow .15s"
                }}
                onMouseOver={e => (e.currentTarget.style.transform = "scale(1.035)")}
                onMouseOut={e => (e.currentTarget.style.transform = "scale(1)")}
              >
                {kalk.bezeichnung}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

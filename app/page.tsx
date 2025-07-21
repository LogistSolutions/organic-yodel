"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [kundennummer, setKundennummer] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kundennummer.trim()) {
      setError("Bitte Kundennummer eingeben.");
      return;
    }
    if (kundennummer.trim().toLowerCase() === "admin") {
      router.push("/admin");
      return;
    }
    router.push(`/kunde/${kundennummer.trim()}`);
  };

  return (
    <div className="main-container" style={{ maxWidth: 420 }}>
      <div className="logo-wrapper">
        <img src="/LogistLogo.png" alt="Logist Logo" />
      </div>
      <h1>Kalkulator Portal</h1>
      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        <label style={{ fontWeight: 600, color: "#e74027" }}>
          Kundennummer
        </label>
        <input
          type="text"
          className="input-modern"
          placeholder="Ihre Kundennummer"
          value={kundennummer}
          onChange={e => {
            setKundennummer(e.target.value);
            setError("");
          }}
          style={{ width: "100%", marginTop: 12, marginBottom: 12 }}
        />
        <button type="submit" className="cta-btn" style={{ marginTop: 8 }}>
          Weiter
        </button>
        {error && <div style={{ color: "#e74027", marginTop: 10 }}>{error}</div>}
      </form>
    </div>
  );
}

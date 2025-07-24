import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import Kalkulator2 from '../../components/Kalkulator2';
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

export default async function KalkulatorPage({ params, searchParams }: any) {
  // Hole Config
  const configPath = path.join(process.cwd(), "app", "data", "config.json");
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  // Parameter auslesen
  const kundennummer = searchParams.kundennr;
  const kalkId = params.id;
  const kundeConfig = config.kunden[kundennummer];

  // Existenz und Freischaltung prüfen
  if (
    !kundeConfig ||
    !kundeConfig.kalkulatoren ||
    !kundeConfig.kalkulatoren.some((k: any) => k.id === kalkId)
  ) {
    return notFound();
  }

  // Kalkulator-Auswahl nach ID
  if (kalkId === "Kalkulator") {
    return <AssetpreisKalkulator config={kundeConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator2") {
    return <Kalkulator2 config={kundeConfig} kundennummer={kundennummer} />;
  }

  // Für weitere Kalkulatoren entsprechend erweitern

  return notFound();
}

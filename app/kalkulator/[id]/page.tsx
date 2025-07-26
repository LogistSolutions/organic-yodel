import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import Kalkulator2 from '../../components/Kalkulator2';
import AssetpreisKalkulatorEN from '../../components/AssetpreisKalkulatorEN';
import Kalkulator2EN from '../../components/Kalkulator2EN';
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

export default async function KalkulatorPage({ params, searchParams }: any) {
  // Parameter auslesen
  const kundennummer = searchParams.kundennr;
  const kalkId = params.id;

  // Hole Config ASYNCHRON innerhalb der Funktion!
  const configPath = path.join(process.cwd(), "app", "data", "config.json");
  const configStr = await fs.promises.readFile(configPath, "utf-8");
  const config = JSON.parse(configStr);

  const kundeConfig = config.kunden[kundennummer];

  // Existenz und Freischaltung prüfen
  if (
    !kundeConfig ||
    !kundeConfig.kalkulatoren ||
    !kundeConfig.kalkulatoren.some((k: any) => k.id === kalkId)
  ) {
    return notFound();
  }

  // Kalkulator-spezifische Zusatzdaten raussuchen (labels, staffeln, ...)
  const kalkulatorObj = kundeConfig.kalkulatoren.find((k: any) => k.id === kalkId) || {};
  const mergedConfig = {
    ...kundeConfig,
    ...(kalkulatorObj.labels ? { labels: kalkulatorObj.labels } : {}),
    ...(kalkulatorObj.staffeln ? { staffeln: kalkulatorObj.staffeln } : {}),
    // Hier ggf. weitere spezielle Felder wie staffeln, preise etc.
  };

  // Kalkulator-Auswahl nach ID
  if (kalkId === "Kalkulator") {
    return <AssetpreisKalkulator config={mergedConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator2") {
    return <Kalkulator2 config={mergedConfig} kundennummer={kundennummer} />;
  }
    if (kalkId === "KalkulatorEN") {
    return <AssetpreisKalkulatorEN config={mergedConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator2EN") {
    return <Kalkulator2EN config={mergedConfig} kundennummer={kundennummer} />;
  }

  // Für weitere Kalkulatoren entsprechend erweitern

  return notFound();
}
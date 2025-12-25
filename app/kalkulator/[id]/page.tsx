import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import Kalkulator2 from '../../components/Kalkulator2';
import AssetpreisKalkulatorEN from '../../components/AssetpreisKalkulatorEN';
import Kalkulator2EN from '../../components/Kalkulator2EN';
import AssetpreisKalkulatorAdmin from '../../components/AssetpreisKalkulatorAdmin';
import GreenIT from '../../components/GreenIT';
import GreenIT_externeKunden from '../../components/GreenIT_externeKunden';
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";
import { buildKalkulatorConfig } from "../../utils/buildKalkulatorConfig"; // ✅ Import hinzufügen

export default async function KalkulatorPage({ params, searchParams }: any) {
  const kundennummer = searchParams.kundennr;
  const kalkId = params.id;

  const configPath = path.join(process.cwd(), "app", "data", "config.json");
  const configStr = await fs.promises.readFile(configPath, "utf-8");
  const config = JSON.parse(configStr);

  const kundeConfig = config.kunden[kundennummer];

  if (
    !kundeConfig ||
    !kundeConfig.kalkulatoren ||
    !kundeConfig.kalkulatoren.some((k: any) => k.id === kalkId)
  ) {
    return notFound();
  }

  // ❌ Statt mergedConfig…
  // ✅ ...baue die korrekte Config aus Kalkulator + Kunde

  const flatConfig = buildKalkulatorConfig(kundeConfig, kalkId);
  if (kalkId === "GreenIT") {
    return <GreenIT config={flatConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "GreenIT_externeKunden") {
    return <GreenIT_externeKunden config={flatConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator") {
    return <AssetpreisKalkulator config={flatConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator2") {
    return <Kalkulator2 config={flatConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "KalkulatorEN") {
    return <AssetpreisKalkulatorEN config={flatConfig} kundennummer={kundennummer} />;
  }
  if (kalkId === "Kalkulator2EN") {
    return <Kalkulator2EN config={flatConfig} kundennummer={kundennummer} />;
  }
    if (kalkId === "KalkulatorAdmin") {
    return <AssetpreisKalkulatorAdmin config={flatConfig} kundennummer={kundennummer} />;
  }

  return notFound();
}

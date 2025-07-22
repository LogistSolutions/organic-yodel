import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

export default function KundePage({ params }: { params: { code: string } }) {
  // Pfad zur config.json ermitteln:
  const configPath = path.join(process.cwd(), "app", "data", "config.json");
  // JSON synchron einlesen (geht serverseitig in Next.js!)
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const kundeConfig = config.kunden[params.code];
  if (!kundeConfig) return notFound();

  return (
    <AssetpreisKalkulator
      config={kundeConfig}
      kundennummer={params.code}
    />
  );
}

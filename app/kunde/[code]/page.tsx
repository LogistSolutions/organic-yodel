import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
<<<<<<< HEAD
=======
import configImport from '../../data/config.json';
>>>>>>> 6f52456fc071f64f2aa4cfbc8d5ee572aa17778f
import { notFound } from "next/navigation";
import fs from "fs";
import path from "path";

<<<<<<< HEAD
export default function KundePage({ params }: { params: { code: string } }) {
  // Pfad zur config.json ermitteln:
  const configPath = path.join(process.cwd(), "app", "data", "config.json");
  // JSON synchron einlesen (geht serverseitig in Next.js!)
  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
=======
export default async function KundePage({ params }: { params: { code: string } }) {
  // configImport ist ein Promise! Also:
  const config: any = await configImport;
>>>>>>> 6f52456fc071f64f2aa4cfbc8d5ee572aa17778f

  const kundeConfig = config.kunden[params.code];
  if (!kundeConfig) return notFound();

  return (
    <AssetpreisKalkulator
      config={kundeConfig}
      kundennummer={params.code}
    />
  );
}

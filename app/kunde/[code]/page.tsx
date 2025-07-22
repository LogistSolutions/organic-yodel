import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import configImport from '../../data/config.json';
import { notFound } from "next/navigation";

export default async function KundePage({ params }: { params: { code: string } }) {
  // configImport ist ein Promise! Also:
  const config: any = await configImport;

  const kundeConfig = config.kunden[params.code];
  if (!kundeConfig) return notFound();

  return (
    <AssetpreisKalkulator
      config={kundeConfig}
      kundennummer={params.code}
    />
  );
}

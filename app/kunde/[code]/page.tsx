import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import config from '../../data/config.json';
import { notFound } from "next/navigation";

export default function KundePage({ params }: { params: { code: string } }) {
  const kundeConfig = config.kunden[params.code];
  if (!kundeConfig) return notFound();

  return (
    <AssetpreisKalkulator
      config={kundeConfig}
      kundennummer={params.code}
    />
  );
}

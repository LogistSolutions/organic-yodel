import AssetpreisKalkulator from '../../components/AssetpreisKalkulator';
import config from "../../data/config.json";
import { notFound } from "next/navigation";

type Params = { params: { code: string } };

export default function KundePage({ params }: Params) {
  const kundeConfig = config.kunden[params.code];
  if (!kundeConfig) return notFound();

  return (
    <AssetpreisKalkulator
      config={kundeConfig}
      kundennummer={params.code}
    />
  );
}
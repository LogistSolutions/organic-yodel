import AssetpreisKalkulator from "../../components/AssetpreisKalkulator";
import config from "../../data/config.json";
import { notFound } from "next/navigation";

export default async function KundePage({ params }: { params: { code: string } }) {
  const kundencode = params.code;
  // @ts-ignore: config-Kunden ist any
  const kundeConfig = config.kunden[kundencode];

  if (!kundeConfig) return notFound();

  return <AssetpreisKalkulator config={kundeConfig} />;
}

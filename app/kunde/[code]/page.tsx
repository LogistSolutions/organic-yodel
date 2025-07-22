import AssetpreisKalkulator from "../../components/AssetpreisKalkulator";
import config from "../../data/config.json";
import { notFound } from "next/navigation";

export default function KundePage({ params }: { params: { code: string } }) {
  const kundencode = params.code;
  // Prüfe, ob der Code existiert (achte auf ggf. string/number!)
  // @ts-ignore: config-Kunden könnten als any geladen werden, das ist hier ok.
  const kundeConfig = config.kunden[kundencode];

  if (!kundeConfig) return notFound();

  return <AssetpreisKalkulator config={kundeConfig} />;
}

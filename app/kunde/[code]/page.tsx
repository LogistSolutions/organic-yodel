import AssetpreisKalkulator from "../../components/AssetpreisKalkulator";
import config from "../../data/config.json";
import { notFound } from "next/navigation";

type Props = { params: { code: string } };

export default function KundePage({ params }: Props) {
  const kundencode = params.code;
  // @ts-ignore
  const kundeConfig = config.kunden[kundencode];

  if (!kundeConfig) return notFound();

  return <AssetpreisKalkulator config={kundeConfig} />;
}

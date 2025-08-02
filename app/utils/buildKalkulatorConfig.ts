export function buildKalkulatorConfig(kundeConfig: any, kalkulatorId: string) {
  if (!kundeConfig || !kundeConfig.kalkulatoren) return {};
  const kalkulator = kundeConfig.kalkulatoren.find((k: any) => k.id === kalkulatorId);
  if (!kalkulator) return {};

  return {
    labels: kalkulator.labels ?? kundeConfig.labels,
    staffeln: kalkulator.staffeln ?? kundeConfig.staffeln,
    invoice: kundeConfig.rechnung,
    pickupAddress: kundeConfig.abholadresse,
    deliveryAddress: kalkulator.lieferadresse ?? kundeConfig.lieferadresse,
    alternateDelivery: kalkulator.lieferadresse_abweichend ?? kundeConfig.lieferadresse_abweichend,
    prices: kalkulator.prices ?? kundeConfig.prices,
    palletUnits: kalkulator.palletUnits ?? kundeConfig.palletUnits,
    packagingMaterial: kalkulator.packagingMaterial ?? kundeConfig.packagingMaterial,
    packagingTime: kalkulator.packagingTime ?? kundeConfig.packagingTime,

    // Einheitliche Adressfelder für beide Sprachversionen:
    rechnung: kundeConfig.rechnung,
    abholadresse: kundeConfig.abholadresse,
    lieferadresse_abweichend: kundeConfig.lieferadresse_abweichend,
    lieferadresse: kundeConfig.lieferadresse,
  };
}

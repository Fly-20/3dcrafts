/**
 * Pricing settings (HQ technical brief §9.1). Stored as one JSON row in
 * `pricing_settings` (migration 0007) and editable at /admin/pricing. Money
 * is in pounds here because these are rates, not stored amounts; the engine
 * returns integer pence.
 *
 * Any key missing from the stored row falls back to these defaults, so adding
 * a setting later needs no data migration.
 */
export type PricingSettings = {
  vatRate: number;
  labourPerHour: number;
  designPerHour: number;
  /** Part of the entered labour minutes treated as per-job setup when working out quantity breaks. */
  setupMinutes: number;

  filamentPerKgIncVat: number;
  filamentWaste: number;
  printerPrice: number;
  printerLifetimeHours: number;
  printerElectricityPerHour: number;
  printerMaintenancePerHour: number;
  /** Failure buffer on printer time: short (< shortHours), medium (up to longHours), long (above). */
  printFailureShort: number;
  printFailureMedium: number;
  printFailureLong: number;
  printFailureShortHours: number;
  printFailureLongHours: number;
  printerBedMm: number;

  laserPrice: number;
  laserLifetimeHours: number;
  laserElectricityPerHour: number;
  laserMaintenancePerHour: number;
  laserFailure: number;
  laserConsumables: number;
  laserBedWidthMm: number;
  laserBedHeightMm: number;
  plywoodSheetPriceIncVat: number;
  plywoodSheetWidthMm: number;
  plywoodSheetHeightMm: number;
  plywoodWaste: number;
  plywoodMarginMm: number;

  packaging: number;
  postage: number;

  etsyPercentFee: number;
  etsyFixedFee: number;
  etsyAcquisition: number;
  websitePercentFee: number;
  websiteFixedFee: number;
  websiteAcquisition: number;

  targetMarkup: number;
  floorMarkup: number;
  minimumOrder: number;
  roundTo: number;

  premiumPrintTimeFactor: number;
  premiumFinishingFactor: number;
  expressUplift: number;

  bigJobPrice: number;
  bigJobUnits: number;
};

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  vatRate: 0.2,
  labourPerHour: 15,
  designPerHour: 15,
  setupMinutes: 10,

  filamentPerKgIncVat: 10,
  filamentWaste: 0.1,
  printerPrice: 700,
  printerLifetimeHours: 5000,
  printerElectricityPerHour: 0.04,
  printerMaintenancePerHour: 0.05,
  printFailureShort: 0.05,
  printFailureMedium: 0.1,
  printFailureLong: 0.15,
  printFailureShortHours: 6,
  printFailureLongHours: 15,
  printerBedMm: 256,

  laserPrice: 1000,
  laserLifetimeHours: 3000,
  laserElectricityPerHour: 0.03,
  laserMaintenancePerHour: 0.1,
  laserFailure: 0.1,
  laserConsumables: 0.3,
  laserBedWidthMm: 430,
  laserBedHeightMm: 390,
  plywoodSheetPriceIncVat: 16.7,
  plywoodSheetWidthMm: 1830,
  plywoodSheetHeightMm: 607,
  plywoodWaste: 0.25,
  plywoodMarginMm: 5,

  packaging: 1,
  postage: 3.99,

  // Etsy: 6.5% transaction + 4% processing; £0.20 processing + ~£0.16 listing.
  etsyPercentFee: 0.105,
  etsyFixedFee: 0.36,
  etsyAcquisition: 1,
  // Stripe: 1.5% + £0.20.
  websitePercentFee: 0.015,
  websiteFixedFee: 0.2,
  websiteAcquisition: 0.5,

  targetMarkup: 0.3,
  floorMarkup: 0.1,
  minimumOrder: 10,
  roundTo: 0.5,

  premiumPrintTimeFactor: 1.3,
  premiumFinishingFactor: 1.5,
  expressUplift: 0.3,

  bigJobPrice: 150,
  bigJobUnits: 20,
};

type SettingField = { key: keyof PricingSettings; label: string; hint?: string; percent?: boolean };

/** Grouped fields for the settings form. `percent` fields are shown as 0–100. */
export const PRICING_SETTING_GROUPS: { title: string; fields: SettingField[] }[] = [
  {
    title: "Labour, VAT and markup",
    fields: [
      { key: "labourPerHour", label: "Labour (£/h)" },
      { key: "designPerHour", label: "Design (£/h)" },
      { key: "setupMinutes", label: "Setup per job (min)", hint: "Kept fixed when scaling quantity breaks" },
      { key: "vatRate", label: "VAT (%)", percent: true },
      { key: "targetMarkup", label: "Target markup (%)", percent: true },
      { key: "floorMarkup", label: "Floor markup (%)", percent: true },
      { key: "minimumOrder", label: "Minimum order (£)" },
      { key: "roundTo", label: "Round up to (£)" },
    ],
  },
  {
    title: "3D printing (Bambu P2S)",
    fields: [
      { key: "filamentPerKgIncVat", label: "Filament (£/kg inc VAT)" },
      { key: "filamentWaste", label: "Filament waste (%)", percent: true },
      { key: "printerPrice", label: "Printer price (£)" },
      { key: "printerLifetimeHours", label: "Printer lifetime (h)" },
      { key: "printerElectricityPerHour", label: "Electricity (£/h)" },
      { key: "printerMaintenancePerHour", label: "Maintenance (£/h)" },
      { key: "printFailureShort", label: "Failure buffer, short prints (%)", percent: true },
      { key: "printFailureShortHours", label: "Short prints are under (h)" },
      { key: "printFailureMedium", label: "Failure buffer, medium prints (%)", percent: true },
      { key: "printFailureLongHours", label: "Long prints are over (h)" },
      { key: "printFailureLong", label: "Failure buffer, long prints (%)", percent: true },
      { key: "printerBedMm", label: "Build volume (mm cube)" },
    ],
  },
  {
    title: "Laser (xTool D1 Pro) and plywood",
    fields: [
      { key: "laserPrice", label: "Laser price (£)" },
      { key: "laserLifetimeHours", label: "Laser lifetime (h)" },
      { key: "laserElectricityPerHour", label: "Electricity + air assist (£/h)" },
      { key: "laserMaintenancePerHour", label: "Maintenance (£/h)" },
      { key: "laserFailure", label: "Failure buffer (%)", percent: true },
      { key: "laserConsumables", label: "Consumables per job (£)" },
      { key: "laserBedWidthMm", label: "Bed width (mm)" },
      { key: "laserBedHeightMm", label: "Bed height (mm)" },
      { key: "plywoodSheetPriceIncVat", label: "Plywood sheet (£ inc VAT)" },
      { key: "plywoodSheetWidthMm", label: "Sheet width (mm)" },
      { key: "plywoodSheetHeightMm", label: "Sheet height (mm)" },
      { key: "plywoodWaste", label: "Sheet wastage (%)", percent: true },
      { key: "plywoodMarginMm", label: "Margin per piece (mm)" },
    ],
  },
  {
    title: "Packaging, postage and channels",
    fields: [
      { key: "packaging", label: "Box (£)" },
      { key: "postage", label: "Postage (£)" },
      { key: "etsyPercentFee", label: "Etsy % fees", percent: true },
      { key: "etsyFixedFee", label: "Etsy fixed fees (£)" },
      { key: "etsyAcquisition", label: "Etsy acquisition per order (£)" },
      { key: "websitePercentFee", label: "Website (Stripe) % fee", percent: true },
      { key: "websiteFixedFee", label: "Website fixed fee (£)" },
      { key: "websiteAcquisition", label: "Website acquisition per order (£)" },
    ],
  },
  {
    title: "Quote options and checks",
    fields: [
      { key: "premiumPrintTimeFactor", label: "Premium: print time ×", hint: "Finer layers / PETG" },
      { key: "premiumFinishingFactor", label: "Premium: finishing time ×" },
      { key: "expressUplift", label: "Express uplift (%)", percent: true },
      { key: "bigJobPrice", label: "Big job over (£)" },
      { key: "bigJobUnits", label: "Big job over (units)" },
    ],
  },
];

/** Merges a stored (possibly partial or stale) settings object over the defaults, ignoring anything that isn't a finite number. */
export function mergePricingSettings(stored: unknown): PricingSettings {
  const merged = { ...DEFAULT_PRICING_SETTINGS };
  if (stored && typeof stored === "object") {
    for (const key of Object.keys(DEFAULT_PRICING_SETTINGS) as (keyof PricingSettings)[]) {
      const value = (stored as Record<string, unknown>)[key];
      if (typeof value === "number" && Number.isFinite(value)) merged[key] = value;
    }
  }
  return merged;
}

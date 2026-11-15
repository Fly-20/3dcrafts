import type { PricingSettings } from "./settings";

/**
 * Pricing engine (HQ technical brief §9.2):
 *
 *   direct_cost = material + machine + labour + design + packaging + postage + acquisition
 *   P (inc VAT) = (direct_cost × (1 + markup) + fixed_fees) / (1/1.2 − pct_fees)
 *   final       = max(P, £10) rounded up to the next 50p
 *
 * Pure and synchronous so the admin page can price as you type and the server
 * can recompute the same numbers before saving. Costs are worked out in
 * pounds (floats) and every amount returned is integer pence.
 */

export type Channel = "etsy" | "website" | "other";
export type OptionKey = "standard" | "premium" | "express";

export type QuoteInputs = {
  channel: Channel;
  /** Units in the order. All the amounts below are for the whole order. */
  quantity: number;
  material: string;
  /** From Bambu Studio, for the whole order. */
  printGrams: number;
  printHours: number;
  laserMinutes: number;
  /** Plywood area in cm², margins included. If 0, worked out from the piece size × quantity. */
  plywoodAreaCm2: number;
  /** Size of one piece (mm); used for the feasibility check and the plywood area. 0 = unknown. */
  pieceWidthMm: number;
  pieceHeightMm: number;
  pieceDepthMm: number;
  /** Your hands-on time for the whole order: setup, post-processing, packing. */
  labourMinutes: number;
  designHours: number;
  /** Optional manual total price (£) for the Standard option; checked against the floor. */
  priceOverride: number | null;
};

export const EMPTY_QUOTE_INPUTS: QuoteInputs = {
  channel: "etsy",
  quantity: 1,
  material: "PLA",
  printGrams: 0,
  printHours: 0,
  laserMinutes: 0,
  plywoodAreaCm2: 0,
  pieceWidthMm: 0,
  pieceHeightMm: 0,
  pieceDepthMm: 0,
  labourMinutes: 0,
  designHours: 0,
  priceOverride: null,
};

export type CostBreakdown = {
  filament: number;
  printer: number;
  plywood: number;
  laser: number;
  consumables: number;
  labour: number;
  design: number;
  packaging: number;
  postage: number;
  acquisition: number;
  direct: number;
};

export type PricedOption = {
  key: OptionKey;
  label: string;
  description: string;
  /** All in pence. `price` is the quoted total inc VAT and postage. */
  price: number;
  perUnit: number;
  /** Etsy charges postage separately: the item price is the total minus postage. Null for other channels. */
  etsyItemPrice: number | null;
  /** Lowest acceptable total (10% markup), not rounded. */
  floor: number;
  /** Total at which the job only just covers its costs (0% markup). */
  breakEven: number;
  profit: number;
  vat: number;
  fees: number;
  costs: CostBreakdown;
};

export type QuantityBreak = { quantity: number; price: number; perUnit: number };

export type Warning = { level: "block" | "warn" | "info"; message: string };

export type QuoteResult = {
  options: PricedOption[];
  breaks: QuantityBreak[];
  /** Standard price, or the override if one was entered. Pence. */
  quotedPrice: number;
  quotedProfit: number;
  warnings: Warning[];
  plywoodAreaCm2: number;
};

const OPTION_INFO: Record<OptionKey, { label: string; description: string }> = {
  standard: { label: "Standard", description: "As specified, standard finish and delivery" },
  premium: { label: "Premium", description: "Finer layers or PETG, extra finishing" },
  express: { label: "Express", description: "Priority in the queue, 1st class postage" },
};

const QUANTITY_BREAKS = [1, 5, 10, 25, 50, 100];

function channelFees(settings: PricingSettings, channel: Channel) {
  return channel === "etsy"
    ? { percent: settings.etsyPercentFee, fixed: settings.etsyFixedFee, acquisition: settings.etsyAcquisition }
    : { percent: settings.websitePercentFee, fixed: settings.websiteFixedFee, acquisition: settings.websiteAcquisition };
}

export function printFailureRate(settings: PricingSettings, hours: number) {
  if (hours < settings.printFailureShortHours) return settings.printFailureShort;
  if (hours <= settings.printFailureLongHours) return settings.printFailureMedium;
  return settings.printFailureLong;
}

export function printerRatePerHour(settings: PricingSettings) {
  return settings.printerPrice / settings.printerLifetimeHours + settings.printerElectricityPerHour + settings.printerMaintenancePerHour;
}

export function laserRatePerHour(settings: PricingSettings) {
  return settings.laserPrice / settings.laserLifetimeHours + settings.laserElectricityPerHour + settings.laserMaintenancePerHour;
}

/** Cost of usable plywood per cm², ex VAT, with sheet wastage built in. */
export function plywoodPerCm2(settings: PricingSettings) {
  const sheetCm2 = (settings.plywoodSheetWidthMm * settings.plywoodSheetHeightMm) / 100;
  const sheetExVat = settings.plywoodSheetPriceIncVat / (1 + settings.vatRate);
  return sheetExVat / sheetCm2 / (1 - settings.plywoodWaste);
}

/** Plywood area for the order: entered area, or (piece + margin each side) × quantity. */
export function plywoodArea(settings: PricingSettings, inputs: QuoteInputs) {
  if (inputs.plywoodAreaCm2 > 0) return inputs.plywoodAreaCm2;
  if (inputs.laserMinutes <= 0 || inputs.pieceWidthMm <= 0 || inputs.pieceHeightMm <= 0) return 0;
  const margin = 2 * settings.plywoodMarginMm;
  return (((inputs.pieceWidthMm + margin) * (inputs.pieceHeightMm + margin)) / 100) * Math.max(1, inputs.quantity);
}

/** Direct costs in pounds. `failureHours` fixes the failure-buffer tier (used when scaling quantity breaks). */
export function directCosts(settings: PricingSettings, inputs: QuoteInputs, failureHours = inputs.printHours): CostBreakdown {
  const fees = channelFees(settings, inputs.channel);
  const filament = (inputs.printGrams / 1000) * (settings.filamentPerKgIncVat / (1 + settings.vatRate)) * (1 + settings.filamentWaste);
  const printer = inputs.printHours * printerRatePerHour(settings) * (1 + printFailureRate(settings, failureHours));
  const plywood = plywoodArea(settings, inputs) * plywoodPerCm2(settings);
  const laser = (inputs.laserMinutes / 60) * laserRatePerHour(settings) * (1 + settings.laserFailure);
  const consumables = inputs.laserMinutes > 0 || inputs.plywoodAreaCm2 > 0 ? settings.laserConsumables : 0;
  const labour = (inputs.labourMinutes / 60) * settings.labourPerHour;
  const design = inputs.designHours * settings.designPerHour;
  const packaging = settings.packaging;
  const postage = settings.postage;
  const acquisition = fees.acquisition;
  const direct = filament + printer + plywood + laser + consumables + labour + design + packaging + postage + acquisition;
  return { filament, printer, plywood, laser, consumables, labour, design, packaging, postage, acquisition, direct };
}

/** Price inc VAT (pounds, unrounded) that leaves `markup` on top of the direct cost after fees and VAT. */
export function priceForMarkup(settings: PricingSettings, channel: Channel, direct: number, markup: number) {
  const fees = channelFees(settings, channel);
  return (direct * (1 + markup) + fees.fixed) / (1 / (1 + settings.vatRate) - fees.percent);
}

/** Max with the minimum order, then up to the next rounding step (50p). Returns pence. */
export function roundPrice(settings: PricingSettings, pounds: number) {
  const step = Math.round(settings.roundTo * 100);
  const pence = Math.ceil(Math.max(pounds, settings.minimumOrder) * 100 - 1e-6);
  return Math.ceil(pence / step) * step;
}

/** Profit in pence at a given total (pence): ex-VAT revenue minus channel fees minus direct cost. */
export function profitAt(settings: PricingSettings, channel: Channel, pricePence: number, direct: number) {
  const fees = channelFees(settings, channel);
  const price = pricePence / 100;
  return Math.round((price / (1 + settings.vatRate) - fees.percent * price - fees.fixed - direct) * 100);
}

function feesAt(settings: PricingSettings, channel: Channel, pricePence: number) {
  const fees = channelFees(settings, channel);
  return Math.round(fees.percent * pricePence + fees.fixed * 100);
}

function vatIn(settings: PricingSettings, pricePence: number) {
  return Math.round(pricePence - pricePence / (1 + settings.vatRate));
}

function premiumInputs(settings: PricingSettings, inputs: QuoteInputs): QuoteInputs {
  const setup = Math.min(inputs.labourMinutes, settings.setupMinutes);
  return {
    ...inputs,
    printHours: inputs.printHours * settings.premiumPrintTimeFactor,
    labourMinutes: setup + (inputs.labourMinutes - setup) * settings.premiumFinishingFactor,
  };
}

/** Scales an order to a different quantity: materials and machine time per unit; setup and design once per job. */
export function scaleInputs(settings: PricingSettings, inputs: QuoteInputs, quantity: number): QuoteInputs {
  const from = Math.max(1, inputs.quantity);
  const ratio = quantity / from;
  const setup = Math.min(inputs.labourMinutes, settings.setupMinutes);
  return {
    ...inputs,
    quantity,
    printGrams: inputs.printGrams * ratio,
    printHours: inputs.printHours * ratio,
    laserMinutes: inputs.laserMinutes * ratio,
    plywoodAreaCm2: plywoodArea(settings, inputs) * ratio,
    labourMinutes: setup + (inputs.labourMinutes - setup) * ratio,
    priceOverride: null,
  };
}

function priceOption(settings: PricingSettings, inputs: QuoteInputs, key: OptionKey): PricedOption {
  const optionInputs = key === "premium" ? premiumInputs(settings, inputs) : inputs;
  const costs = directCosts(settings, optionInputs, inputs.printHours);
  const target = priceForMarkup(settings, inputs.channel, costs.direct, settings.targetMarkup);
  const price = roundPrice(settings, key === "express" ? target * (1 + settings.expressUplift) : target);
  const quantity = Math.max(1, inputs.quantity);
  return {
    key,
    ...OPTION_INFO[key],
    price,
    perUnit: Math.round(price / quantity),
    etsyItemPrice: inputs.channel === "etsy" ? price - Math.round(settings.postage * 100) : null,
    floor: Math.round(priceForMarkup(settings, inputs.channel, costs.direct, settings.floorMarkup) * 100),
    breakEven: Math.round(priceForMarkup(settings, inputs.channel, costs.direct, 0) * 100),
    profit: profitAt(settings, inputs.channel, price, costs.direct),
    vat: vatIn(settings, price),
    fees: feesAt(settings, inputs.channel, price),
    costs,
  };
}

function fitsPrinter(settings: PricingSettings, inputs: QuoteInputs) {
  return [inputs.pieceWidthMm, inputs.pieceHeightMm, inputs.pieceDepthMm].every((size) => size <= settings.printerBedMm);
}

function fitsLaser(settings: PricingSettings, inputs: QuoteInputs) {
  const { pieceWidthMm: w, pieceHeightMm: h } = inputs;
  const W = settings.laserBedWidthMm;
  const H = settings.laserBedHeightMm;
  return (w <= W && h <= H) || (w <= H && h <= W);
}

export function priceQuote(settings: PricingSettings, inputs: QuoteInputs): QuoteResult {
  const options = (["standard", "premium", "express"] as OptionKey[]).map((key) => priceOption(settings, inputs, key));
  const standard = options[0];

  const quantities = [...new Set([...QUANTITY_BREAKS, Math.max(1, inputs.quantity)])].sort((a, b) => a - b);
  const breaks = quantities.map((quantity) => {
    const scaled = scaleInputs(settings, inputs, quantity);
    const costs = directCosts(settings, scaled, inputs.printHours);
    const price = roundPrice(settings, priceForMarkup(settings, inputs.channel, costs.direct, settings.targetMarkup));
    return { quantity, price, perUnit: Math.round(price / quantity) };
  });

  const override = inputs.priceOverride !== null && inputs.priceOverride > 0 ? Math.round(inputs.priceOverride * 100) : null;
  const quotedPrice = override ?? standard.price;
  const quotedProfit = profitAt(settings, inputs.channel, quotedPrice, standard.costs.direct);

  const warnings: Warning[] = [];
  const isPrint = inputs.printGrams > 0 || inputs.printHours > 0;
  const isLaser = inputs.laserMinutes > 0 || inputs.plywoodAreaCm2 > 0;

  if (!isPrint && !isLaser && inputs.labourMinutes <= 0 && inputs.designHours <= 0) {
    warnings.push({ level: "info", message: "No making time or material entered yet: the price only covers box, postage and fees." });
  }
  if (isPrint && inputs.printGrams > 0 && inputs.printHours <= 0) warnings.push({ level: "warn", message: "Grams entered but no print hours: machine time is missing." });
  if (isPrint && inputs.printHours > 0 && inputs.printGrams <= 0) warnings.push({ level: "warn", message: "Print hours entered but no grams: filament is missing." });
  if (inputs.labourMinutes <= 0 && (isPrint || isLaser)) warnings.push({ level: "warn", message: "No labour minutes: setup, finishing and packing aren't being paid for." });

  if (override !== null) {
    if (override < standard.breakEven) {
      warnings.push({ level: "block", message: `Override price is below cost (break-even ${pounds(standard.breakEven)}). This job would lose money.` });
    } else if (override < standard.floor) {
      warnings.push({ level: "warn", message: `Override price is below the 10% floor (${pounds(standard.floor)}).` });
    }
  }

  const hasSize = inputs.pieceWidthMm > 0 || inputs.pieceHeightMm > 0 || inputs.pieceDepthMm > 0;
  if (hasSize && isPrint && !fitsPrinter(settings, inputs)) {
    warnings.push({ level: "warn", message: `Doesn't fit the P2S build volume (${settings.printerBedMm} × ${settings.printerBedMm} × ${settings.printerBedMm} mm): it must be split into parts.` });
  }
  if (hasSize && isLaser && !fitsLaser(settings, inputs)) {
    warnings.push({ level: "warn", message: `Larger than the laser bed (${settings.laserBedWidthMm} × ${settings.laserBedHeightMm} mm).` });
  }
  if (quotedPrice > settings.bigJobPrice * 100 || inputs.quantity > settings.bigJobUnits) {
    warnings.push({ level: "info", message: `Big job (over ${pounds(settings.bigJobPrice * 100)} or ${settings.bigJobUnits} units): give it a second look.` });
  }

  return { options, breaks, quotedPrice, quotedProfit, warnings, plywoodAreaCm2: plywoodArea(settings, inputs) };
}

function pounds(pence: number) {
  return `£${(pence / 100).toFixed(2)}`;
}

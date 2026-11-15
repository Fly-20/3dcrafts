/**
 * Text checks for enquiries and draft replies (HQ technical brief §5 and §14).
 * Pure functions so the page can re-run them as the owner edits a draft.
 */

export type Flag = { kind: "safety" | "food" | "copyright" | "children"; message: string; matches: string[] };

const FLAG_RULES: { kind: Flag["kind"]; message: string; pattern: RegExp }[] = [
  {
    kind: "safety",
    message: "Possibly safety-critical (on the \"parts we don't make\" list). Check before quoting, and decline if it is.",
    pattern:
      /\b(brakes?|steering|suspension|seat ?belts?|airbags?|gas (?:appliance|boiler|hob|fitting|valve)s?|boilers?|medical|prosthe\w*|surgical|PPE|helmets?|load[- ]bearing|weight[- ]bearing|climbing|harness(?:es)?|child seats?|car seats?|guns?|firearms?|weapons?|knife|knives|ammo|ammunition|suppressors?|silencers?)\b/gi,
  },
  {
    kind: "food",
    message: "Food contact: standard printed PLA isn't food-safe for repeated use. Use food-safe filament and \"single use / not for direct food contact\" wording; sleeve topper stems.",
    pattern: /\b(cookie cutters?|cake toppers?|cupcake toppers?|food|edible|cups?|mugs?|plates?|bowls?|cutlery|spoons?|straws?|drinking|chocolate moulds?|chocolate molds?|baking)\b/gi,
  },
  {
    kind: "copyright",
    message: "Possibly copyrighted or trademarked (licensed characters, club badges, brand logos). Etsy can take these down; decline unless the customer owns the rights (their own business logo is fine).",
    pattern:
      /\b(disney|marvel|pixar|star wars|harry potter|hogwarts|pok[eé]mon|pikachu|nintendo|mario|zelda|minecraft|fortnite|lego|barbie|hello kitty|bluey|peppa pig|paw patrol|sonic|batman|superman|spider-?man|mickey|warhammer|nike|adidas|ferrari|bmw|mercedes|apple logo|club (?:badge|crest|logo)|football club|hibernian|premier league|logos?|trademark(?:ed)?|copyright(?:ed)?)\b/gi,
  },
  {
    kind: "children",
    message: "For a child: small parts are a choking risk, and toy safety rules apply if it's sold as a toy. Add age warnings.",
    pattern: /\b(toys?|baby|babies|toddlers?|kids?|child(?:ren)?|teething|rattles?)\b/gi,
  },
];

/** Flags a customer message for safety-critical, food-contact, copyright and children's-item risks. */
export function flagMessage(text: string): Flag[] {
  const flags: Flag[] = [];
  for (const rule of FLAG_RULES) {
    const matches = [...new Set((text.match(rule.pattern) ?? []).map((match) => match.toLowerCase()))];
    if (matches.length) flags.push({ kind: rule.kind, message: rule.message, matches });
  }
  return flags;
}

export type DraftIssue = { level: "block" | "warn"; message: string };

/** Every "£12.50"-style figure in a text, as pence. */
export function poundFigures(text: string): number[] {
  return [...text.matchAll(/£\s?(\d{1,3}(?:,\d{3})*|\d+)(?:\.(\d{1,2}))?/g)].map((match) => {
    const whole = Number(match[1].replace(/,/g, ""));
    const fraction = match[2] ? Number(match[2].padEnd(2, "0")) : 0;
    return whole * 100 + fraction;
  });
}

/**
 * §5.2 checks on a draft reply:
 * - every £ figure in the text is one the pricing engine produced (`allowedPence`);
 * - Etsy drafts contain no links, email addresses, phone numbers or "order on our website" steering.
 */
export function checkDraft(text: string, channel: "etsy" | "website" | "other", allowedPence: number[]): DraftIssue[] {
  const issues: DraftIssue[] = [];
  const allowed = new Set(allowedPence);
  const unknown = [...new Set(poundFigures(text).filter((pence) => !allowed.has(pence)))];
  if (unknown.length) {
    issues.push({
      level: "block",
      message: `Price not from the quote: ${unknown.map((pence) => `£${(pence / 100).toFixed(2)}`).join(", ")}. Every £ figure must match the pricing engine.`,
    });
  }

  if (channel === "etsy") {
    if (/https?:\/\/|www\.|\b[a-z0-9-]+\.(?:co\.uk|com|uk|net|org|io|shop|store)\b/i.test(text)) {
      issues.push({ level: "block", message: "Etsy draft contains a link or web address. Etsy messages must not point buyers off Etsy." });
    }
    if (/[^\s@]+@[^\s@]+\.[^\s@]+/.test(text)) issues.push({ level: "block", message: "Etsy draft contains an email address." });
    if (/(?:\+44\s?|\b0)\d(?:[\s-]?\d){8,9}\b/.test(text)) issues.push({ level: "block", message: "Etsy draft contains a phone number." });
    if (/\b(our|my) (web)?site\b|\bwebsite\b|\border (?:it )?(?:directly|direct)\b|\boff etsy\b|\bstripe\b|\bpaypal\b|\bbank transfer\b|\bcheaper (?:on|via|through)\b/i.test(text)) {
      issues.push({ level: "block", message: "Etsy draft mentions the website, direct ordering or another payment route. Keep Etsy buyers on Etsy." });
    }
  }

  if (!text.trim()) issues.push({ level: "warn", message: "The draft is empty." });
  return issues;
}

export type ExtractedSpecs = {
  customerName: string;
  etsyUsername: string;
  email: string;
  summary: string;
  quantity: number | null;
  material: string;
  colours: string;
  pieceWidthMm: number | null;
  pieceHeightMm: number | null;
  pieceDepthMm: number | null;
  deadline: string;
  isLaser: boolean;
  missingInfo: string[];
};

const NUMBER_WORDS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, twelve: 12, twenty: 20, fifty: 50, hundred: 100 };

/** Rough rule-based reading of a customer message, used when there's no ANTHROPIC_API_KEY. */
export function extractSpecsWithRules(text: string): ExtractedSpecs {
  const lower = text.toLowerCase();

  const quantityMatch = lower.match(/\b(\d{1,4}|a|an|one|two|three|four|five|six|seven|eight|nine|ten|twelve|twenty|fifty|hundred)\s*(?:x\s+)?(?:of (?:these|them)|pcs|pieces|units|copies|sets|keyrings?|key ?chains?|cards?|ornaments?|signs?|coasters?|tags?|favours?|favors?|medals?|figures?|parts?|items?|toppers?|cutters?|badges?|magnets?|boxes?|stands?|holders?)\b/);
  const quantityRaw = quantityMatch?.[1];
  const quantity = quantityRaw ? (NUMBER_WORDS[quantityRaw] ?? Number(quantityRaw)) : null;

  let dims: number[] = [];
  const sizeMatch = lower.match(/(\d+(?:\.\d+)?)\s*(mm|cm)?\s*[x×by]+\s*(\d+(?:\.\d+)?)\s*(mm|cm)?(?:\s*[x×by]+\s*(\d+(?:\.\d+)?)\s*(mm|cm)?)?/);
  if (sizeMatch) {
    const unit = sizeMatch[6] || sizeMatch[4] || sizeMatch[2] || "mm";
    const factor = unit === "cm" ? 10 : 1;
    dims = [sizeMatch[1], sizeMatch[3], sizeMatch[5]].filter(Boolean).map((value) => Number(value) * factor);
  } else {
    const single = lower.match(/(\d+(?:\.\d+)?)\s*(mm|cm)\b/);
    if (single) dims = [Number(single[1]) * (single[2] === "cm" ? 10 : 1)];
  }

  const material = /\bpetg\b/.test(lower) ? "PETG" : /\bpla\b/.test(lower) ? "PLA" : /\b(wood|wooden|plywood|engrav\w*|laser)\b/.test(lower) ? "Plywood" : "";
  const colourMatch = lower.match(/\b(black|white|red|blue|green|yellow|orange|pink|purple|grey|gray|gold|silver|clear|transparent|natural)\b/g);
  const deadlineMatch = text.match(/\b(?:by|before|for)\s+((?:mon|tues|wednes|thurs|fri|satur|sun)day\b[^.,\n]*|christmas|xmas|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{1,2}(?:st|nd|rd|th)?|next week|the weekend|end of (?:the )?month)/i);
  const email = text.match(/[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+/)?.[0] ?? "";
  const signOff = text.match(/(?:thanks|thank you|cheers|regards|best|many thanks)[,!.]?\s*\n+\s*([A-Z][a-z]+(?: [A-Z][a-z]+)?)\s*$/i);
  const isLaser = /\b(wood|wooden|plywood|engrav\w*|laser|acrylic|cut out)\b/.test(lower);

  const missingInfo: string[] = [];
  if (!quantity) missingInfo.push("How many you need");
  if (!dims.length) missingInfo.push("What size you'd like");
  if (!colourMatch && !isLaser) missingInfo.push("Which colour you'd like");
  if (!deadlineMatch) missingInfo.push("When you need it by");
  if (!/\b(stl|3mf|step|svg|file|photo|picture|image|drawing|attached|logo)\b/.test(lower)) missingInfo.push("A file, photo or sketch of what you'd like");

  return {
    customerName: signOff?.[1] ?? "",
    etsyUsername: "",
    email,
    // Rules can't summarise reliably; the owner types a title (Claude fills it when configured).
    summary: "",
    quantity,
    material,
    colours: colourMatch ? [...new Set(colourMatch)].join(", ") : "",
    pieceWidthMm: dims[0] ?? null,
    pieceHeightMm: dims[1] ?? null,
    pieceDepthMm: dims[2] ?? null,
    deadline: deadlineMatch?.[1] ?? "",
    isLaser,
    missingInfo,
  };
}

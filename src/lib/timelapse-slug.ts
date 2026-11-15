/**
 * Slug helpers shared by the timelapse admin form (client) and its Server
 * Actions. Timelapse links are printed as QR codes and the public page has no
 * other access check, so new links get a random suffix (`sarah-k7q2m9`)
 * rather than just the customer's name, which anyone could guess.
 */
export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

const suffixAlphabet = "abcdefghijklmnopqrstuvwxyz0123456789";

/** 6 random [a-z0-9] characters (~2 billion combinations), from the Web Crypto API (available in browsers and Node). */
export function randomSlugSuffix(length = 6) {
  let suffix = "";
  while (suffix.length < length) {
    for (const byte of crypto.getRandomValues(new Uint8Array(length * 2))) {
      // 252 = 36 * 7: skipping 252–255 keeps every character equally likely.
      if (byte < 252 && suffix.length < length) suffix += suffixAlphabet[byte % suffixAlphabet.length];
    }
  }
  return suffix;
}

/** Default link for a new timelapse: the customer's name plus a random suffix. */
export function defaultTimelapseSlug(customerName: string, suffix = randomSlugSuffix()) {
  const base = slugify(customerName);
  return base ? `${base}-${suffix}` : suffix;
}

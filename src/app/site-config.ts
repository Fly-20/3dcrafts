export const siteConfig = {
  name: "3DCRAFTS",
  url: "https://3dcrafts.uk",
  email: "hello@3dcrafts.uk",
  location: {
    city: "Edinburgh",
    region: "Scotland",
    country: "GB",
  },
  // Optional trading details shown on the legal pages when set (e.g. "Jane Smith trading as 3DCRAFTS", "SC123456", "ICO reference ZA123456").
  legalName: process.env.NEXT_PUBLIC_LEGAL_NAME,
  companyNumber: process.env.NEXT_PUBLIC_COMPANY_NUMBER,
  icoRegistration: process.env.NEXT_PUBLIC_ICO_REGISTRATION,
  title: "3D Printing & Laser Cutting Edinburgh | 3DCRAFTS",
  description: "Custom 3D printing, rapid prototyping, laser cutting and engraving from an independent Edinburgh workshop, with collection and UK delivery.",
  // Digits only, with country code, e.g. 447700900123. The WhatsApp button is hidden in production until this is set.
  whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || (process.env.NODE_ENV === "production" ? "" : "44XXXXXXXXXX"),
  etsyUrl: process.env.NEXT_PUBLIC_ETSY_URL || "https://www.etsy.com/uk/shop/TheKeepsakeAndCo#reviews",
  googleBusinessProfileUrl: process.env.GOOGLE_BUSINESS_PROFILE_URL,
} as const;

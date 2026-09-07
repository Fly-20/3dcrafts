export const siteConfig = {
  name: "3DCRAFTS",
  url: "https://3dcrafts.uk",
  email: "hello@3dcrafts.uk",
  location: {
    city: "Edinburgh",
    region: "Scotland",
    country: "GB",
  },
  title: "3D Printing & Laser Cutting Edinburgh | 3DCRAFTS",
  description: "Custom 3D printing, rapid prototyping, laser cutting and engraving from an independent Edinburgh workshop, with collection and UK delivery.",
  googleBusinessProfileUrl: process.env.GOOGLE_BUSINESS_PROFILE_URL,
} as const;

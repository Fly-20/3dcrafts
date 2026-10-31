import type { Metadata } from "next";
import { Caveat, Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SiteChrome } from "./components/shop-nav";
import { siteConfig } from "./site-config";

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: { canonical: "/" },
  keywords: ["3D printing Edinburgh", "laser cutting Edinburgh", "laser engraving Edinburgh", "rapid prototyping Scotland", "custom fabrication Edinburgh"],
  openGraph: {
    title: siteConfig.title,
    description: siteConfig.description,
    url: "/",
    siteName: siteConfig.name,
    locale: "en_GB",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.title,
    description: siteConfig.description,
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
};

const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space-grotesk", display: "swap" });
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains-mono", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en-GB" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} ${caveat.variable}`}><body><SiteChrome>{children}</SiteChrome></body></html>;
}

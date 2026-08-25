import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://3dcrafts.uk"),
  title: "FORM & FORGE | 3D Printing & Laser Craft, Edinburgh",
  description: "Custom 3D printing, rapid prototyping, small-batch production, laser cutting and engraving from an independent Edinburgh workshop.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "FORM & FORGE | 3D Printing & Laser Craft, Edinburgh",
    description: "Custom 3D printing, rapid prototyping, small-batch production, laser cutting and engraving from an independent Edinburgh workshop.",
    url: "/",
    siteName: "FORM & FORGE",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}

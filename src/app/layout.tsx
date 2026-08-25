import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://3dcrafts.uk"),
  title: "3DCRAFTS | 3D Printing & Laser Craft, Edinburgh",
  description: "Custom 3D printing, rapid prototyping, small-batch production, laser cutting and engraving from an independent Edinburgh workshop.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "3DCRAFTS | 3D Printing & Laser Craft, Edinburgh",
    description: "Custom 3D printing, rapid prototyping, small-batch production, laser cutting and engraving from an independent Edinburgh workshop.",
    url: "/",
    siteName: "3DCRAFTS",
    locale: "en_GB",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en"><body>{children}</body></html>;
}

"use client";

import type { PropsWithChildren } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { siteConfig } from "../site-config";
import { WhatsAppIcon } from "./whatsapp-icon";
import { MobileNav, type NavigationLink } from "./mobile-nav";

const primaryLinks: NavigationLink[] = [
  { href: "/#sectors", label: "Who we make for" },
  { href: "/#how", label: "How it works" },
  { href: "/shop", label: "Shop" },
];

function BrandMark({ light = false }: { light?: boolean }) {
  const fill = light ? "#F5F4F0" : "#16171A";
  return (
    <svg width="32" height="32" viewBox="0 0 44 44" aria-hidden="true">
      <rect x="4" y="29" width="36" height="8" rx="1.5" fill={fill} />
      <rect x="9" y="19" width="26" height="8" rx="1.5" fill={fill} />
      <rect x="14" y="9" width="16" height="8" rx="1.5" fill="#E8590C" />
    </svg>
  );
}

export function SiteHeader() {
  const { itemCount } = useCart();
  const links: NavigationLink[] = [
    ...primaryLinks,
    { href: "/track-order", label: "Track order" },
    { href: "/cart", label: `Cart${itemCount > 0 ? ` (${itemCount})` : ""}` },
  ];
  const whatsappLink: NavigationLink | null = siteConfig.whatsappNumber ? { href: `https://wa.me/${siteConfig.whatsappNumber}`, label: "Message us on WhatsApp", cta: true } : null;

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="3DCRAFTS, home">
          <BrandMark />
          <span className="brand-name">3DCRAFTS</span>
        </Link>
        <nav aria-label="Primary navigation" className="desktop-nav">
          {links.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
          {whatsappLink && <a href={whatsappLink.href} className="whatsapp-btn"><WhatsAppIcon />{whatsappLink.label}</a>}
        </nav>
        <MobileNav links={whatsappLink ? [...links, whatsappLink] : links} />
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div className="footer-brand">
          <Link href="/" className="brand" aria-label="3DCRAFTS, home">
            <BrandMark light />
            <span className="brand-name">3DCRAFTS</span>
          </Link>
          <p>Custom 3D printed and laser-cut pieces for businesses. Made in Edinburgh, delivered across the UK.</p>
        </div>
        <nav aria-label="Footer navigation" className="footer-columns">
          <div>
            <h2>Who we make for</h2>
            <Link href="/#sectors">Trades &amp; repair</Link>
            <Link href="/#sectors">Bakers &amp; food</Link>
            <Link href="/#sectors">Shops &amp; cafés</Link>
            <Link href="/#sectors">Events &amp; weddings</Link>
          </div>
          <div>
            <h2>Orders</h2>
            <Link href="/shop">Shop</Link>
            <Link href="/track-order">Track order</Link>
            <Link href="/#quote">Get a quote</Link>
            <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
            {siteConfig.googleBusinessProfileUrl && <a href={siteConfig.googleBusinessProfileUrl} rel="me noopener noreferrer">Google Business Profile</a>}
          </div>
        </nav>
      </div>
      <div className="footer-bottom">
        <nav aria-label="Legal" className="footer-legal"><Link href="/privacy">Privacy policy</Link><Link href="/returns">Delivery &amp; returns</Link><Link href="/terms">Terms &amp; conditions</Link></nav>
        <p>© 2026 3DCRAFTS. All rights reserved.</p>
      </div>
    </footer>
  );
}

export function SiteChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return children;

  return (
    <div className="flex min-h-svh flex-col">
      <SiteHeader />
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}

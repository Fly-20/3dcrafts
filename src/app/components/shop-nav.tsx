"use client";

import type { PropsWithChildren } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart-store";
import { siteConfig } from "../site-config";
import { MobileNav, type NavigationLink } from "./mobile-nav";

const primaryLinks: NavigationLink[] = [
  { href: "/#services", label: "Services" },
  { href: "/#work", label: "Selected work" },
  { href: "/#process", label: "Process" },
  { href: "/shop", label: "Shop" },
];

export function SiteHeader({ overlay = false }: { overlay?: boolean }) {
  const { itemCount } = useCart();
  const orderLinks: NavigationLink[] = [
    { href: "/track-order", label: "Track order" },
    { href: "/cart", label: `Cart${itemCount > 0 ? ` (${itemCount})` : ""}` },
  ];

  return (
    <>
      <header className="site-header">
        <Link href="/" className="brand" aria-label="3DCRAFTS, home">
          <Image src="/3dcrafts-logo.svg" alt="3DCRAFTS" width={1200} height={310} priority unoptimized />
        </Link>
        <nav aria-label="Primary navigation" className="desktop-nav">
          {primaryLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <nav aria-label="Order navigation" className="header-actions">
          {orderLinks.map((link) => <Link key={link.href} href={link.href}>{link.label}</Link>)}
        </nav>
        <MobileNav links={[...primaryLinks, ...orderLinks]} />
      </header>
      {!overlay && <div className="site-header-spacer" aria-hidden="true" />}
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <Link href="/" className="footer-brand" aria-label="3DCRAFTS, home">
          <Image src="/3dcrafts-footer-logo.svg" alt="3DCRAFTS" width={1200} height={310} unoptimized />
        </Link>
        <div><p>Digital precision.<br />Made with care in Edinburgh.</p></div>
        <nav aria-label="Footer navigation">
          <Link href="/#services">Services</Link>
          <Link href="/#work">Work</Link>
          <Link href="/#process">Process</Link>
          <Link href="/#quote">Contact Us</Link>
        </nav>
        <address>
          <span>Edinburgh, Scotland</span>
          <a href={`mailto:${siteConfig.email}`}>{siteConfig.email}</a>
          {siteConfig.googleBusinessProfileUrl && <a href={siteConfig.googleBusinessProfileUrl} rel="me noopener noreferrer">Google Business Profile</a>}
        </address>
      </div>
      <div className="footer-bottom"><span>© 2026 3DCRAFTS. All rights reserved.</span><Link href="/#top">Back to top ↑</Link></div>
    </footer>
  );
}

export function SiteChrome({ children }: PropsWithChildren) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return children;

  return (
    <>
      <SiteHeader overlay={pathname === "/"} />
      {children}
      <SiteFooter />
    </>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navLinks = [
  { href: "/admin", label: "Home" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/discounts", label: "Discounts" },
  { href: "/admin/gift-cards", label: "Gift cards" },
  { href: "/admin/shipping-rates", label: "Shipping" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 text-sm">
      {navLinks.map((link) => {
        const isActive = link.href === "/admin" ? pathname === "/admin" : pathname.startsWith(link.href);
        return (
          <Link key={link.href} href={link.href} className={`px-2 py-1.5 ${isActive ? "bg-black text-white" : "text-black/70 hover:bg-black/5 hover:text-black"}`}>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

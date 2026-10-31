"use client";

import { WhatsAppIcon } from "./whatsapp-icon";
import { useEffect, useRef, useState } from "react";

export type NavigationLink = {
  href: string;
  label: string;
  cta?: boolean;
  onClick?: () => void;
};

export function MobileNav({ links }: { links: NavigationLink[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleKeyDown);
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const closeMenu = () => setIsOpen(false);
  const dismissMenu = () => {
    closeMenu();
    menuButtonRef.current?.focus();
  };

  return (
    <div className="mobile-nav">
      <button
        ref={menuButtonRef}
        type="button"
        className="menu-toggle"
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        aria-label="Open navigation menu"
        onClick={() => setIsOpen(true)}
      >
        <span /><span /><span />
      </button>

      <div className={`mobile-menu-shell${isOpen ? " is-open" : ""}`}>
        <div className="mobile-menu-backdrop" aria-hidden="true" onClick={dismissMenu} />
        <aside id="mobile-navigation" className="mobile-menu-panel" aria-hidden={!isOpen}>
          <div className="mobile-menu-heading">
            <span>Menu</span>
            <button
              ref={closeButtonRef}
              type="button"
              className="menu-close"
              aria-label="Close navigation menu"
              tabIndex={isOpen ? 0 : -1}
              onClick={dismissMenu}
            >
              <span /><span />
            </button>
          </div>
          <nav aria-label="Mobile navigation">
            {links.map((link) => (
              link.onClick ? (
                <button
                  key={link.href}
                  type="button"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={() => { closeMenu(); link.onClick?.(); }}
                >
                  {link.label}
                </button>
              ) : (
                <a key={link.href} href={link.href} className={link.cta ? "whatsapp-btn" : undefined} tabIndex={isOpen ? 0 : -1} onClick={closeMenu}>
                  {link.cta && <WhatsAppIcon />}{link.label}
                </a>
              )
            ))}
          </nav>
        </aside>
      </div>
    </div>
  );
}

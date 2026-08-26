"use client";

import { useEffect, useRef, useState } from "react";

const links = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Selected work" },
  { href: "#process", label: "Process" },
];

export function MobileNav() {
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
            {links.map((link, index) => (
              <a key={link.href} href={link.href} tabIndex={isOpen ? 0 : -1} onClick={closeMenu}>
                <span>0{index + 1}</span>{link.label}
              </a>
            ))}
          </nav>
          <a className="mobile-menu-cta" href="#quote" tabIndex={isOpen ? 0 : -1} onClick={closeMenu}>Get In Touch <span>→</span></a>
        </aside>
      </div>
    </div>
  );
}

"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";

const MAX_SHIFT = 10;

export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [hovering, setHovering] = useState(false);

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: -relX * MAX_SHIFT * 2, y: -relY * MAX_SHIFT * 2 });
  };

  const handleLeave = () => {
    setHovering(false);
    setOffset({ x: 0, y: 0 });
  };

  return (
    <div
      ref={ref}
      className={`hero-art${hovering ? " is-hovering" : ""}`}
      onMouseEnter={() => setHovering(true)}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      <Image
        src="/hero-sphere-final.png"
        alt="Exploded 3D printed sphere in orange, black and cream showing its internal lattice"
        width={1024}
        height={768}
        unoptimized
        priority
        style={hovering ? { transform: `translate(${offset.x}px, ${offset.y}px)` } : undefined}
      />
    </div>
  );
}

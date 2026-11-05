"use client";

import Image from "next/image";
import { useRef, useState, type MouseEvent } from "react";

const MAX_SHIFT = 18;

export function HeroArt() {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = (e.clientX - rect.left) / rect.width - 0.5;
    const relY = (e.clientY - rect.top) / rect.height - 0.5;
    setOffset({ x: -relX * MAX_SHIFT * 2, y: -relY * MAX_SHIFT * 2 });
  };

  return (
    <div ref={ref} className="hero-art" onMouseMove={handleMove} onMouseLeave={() => setOffset({ x: 0, y: 0 })}>
      <Image
        src="/hero-sphere-final.png"
        alt="Exploded 3D printed sphere in orange, black and cream showing its internal lattice"
        width={1024}
        height={768}
        unoptimized
        priority
        style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}
      />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";

export function OrderCounter({ from = 0, target, step = 1, duration = 3000 }: { from?: number; target: number; step?: number; duration?: number }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    let frame: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const steps = Math.round((progress * (target - from)) / step);
      setCount(from + steps * step);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [from, target, step, duration]);

  return <>{count}+</>;
}

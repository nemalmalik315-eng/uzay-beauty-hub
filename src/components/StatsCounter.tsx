"use client";
import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration: number, start: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!start) return;
    let raf: number;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const p = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);
  return count;
}

export default function StatsCounter() {
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) { setStarted(true); obs.disconnect(); }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const clients = useCountUp(158, 1500, started);
  const years = useCountUp(10, 1200, started);

  const stats = [
    { value: `${clients}+`, label: "Happy Clients" },
    { value: "5.0 ★", label: "Google Rating" },
    { value: `${years}+`, label: "Years Experience" },
  ];

  return (
    <div ref={ref} className="max-w-3xl mx-auto px-4 py-5 grid grid-cols-3 divide-x divide-gold/20">
      {stats.map((item) => (
        <div key={item.label} className="text-center px-3">
          <p className="text-gold font-heading font-bold text-xl md:text-2xl tabular-nums">
            {item.value}
          </p>
          <p className="text-gray-400 text-xs mt-0.5 uppercase tracking-wide">{item.label}</p>
        </div>
      ))}
    </div>
  );
}

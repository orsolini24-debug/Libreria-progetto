"use client";

import { useEffect, useState } from "react";

const COLORS = [
  "#f59e0b", "#d97706", "#fbbf24", "#f97316",
  "#fb923c", "#fef3c7", "#fde68a", "#b45309",
  "#ffffff", "#fed7aa",
];

interface Particle {
  id: number;
  x: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  rotation: number;
  shape: "rect" | "circle";
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

export function ConfettiCelebration({ show }: { show: boolean }) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!show) return;

    // Legge il colore accento del tema corrente dal DOM
    const accentColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent").trim() || "#d97706";
    const accentHover = getComputedStyle(document.documentElement)
      .getPropertyValue("--accent-hover").trim() || "#f59e0b";

    const themeColors = [
      accentColor, accentHover, accentColor, "#ffffff",
      accentColor, "#fde68a", accentHover, "#ffffff",
      accentColor, accentHover,
    ];

    setParticles(
      Array.from({ length: 50 }, (_, i) => ({
        id: i,
        x: rand(2, 98),
        size: rand(6, 13),
        color: themeColors[Math.floor(Math.random() * themeColors.length)],
        duration: rand(1.8, 3.2),
        delay: rand(0, 1.0),
        rotation: rand(0, 360),
        shape: Math.random() > 0.4 ? "rect" : "circle",
      }))
    );
    setVisible(true);

    const t = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(t);
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[200] overflow-hidden">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: "-16px",
            width: p.size,
            height: p.shape === "circle" ? p.size : p.size * 0.55,
            backgroundColor: p.color,
            borderRadius: p.shape === "circle" ? "50%" : "2px",
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
            transform: `rotate(${p.rotation}deg)`,
          }}
        />
      ))}
    </div>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { ThemeCustomizer } from "./ThemeCustomizer";

const THEMES = [
  { id: "ambra",   label: "Ambra",   accent: "#d97706" },
  { id: "oceano",  label: "Oceano",  accent: "#6888aa" },
  { id: "foresta", label: "Foresta", accent: "#5a8a62" },
  { id: "viola",   label: "Viola",   accent: "#8870b0" },
  { id: "rosso",   label: "Rosso",   accent: "#a05858" },
  { id: "ardesia", label: "Ardesia", accent: "#2dd4bf" },
  { id: "seppia",  label: "Seppia",  accent: "#a67c52" },
  { id: "notte",   label: "Notte",   accent: "#a0a0ff" },
] as const;

type ThemeId = (typeof THEMES)[number]["id"] | "custom";
type Mode = "dark" | "light";

function applyPreset(id: string) {
  /* Rimuove eventuali override inline lasciati dal customizer */
  document.documentElement.removeAttribute("style");
  document.documentElement.setAttribute("data-theme", id);
  localStorage.setItem("theme", id);
}

function applyMode(m: Mode) {
  document.documentElement.setAttribute("data-mode", m);
  localStorage.setItem("mode", m);
}

function applyCustom() {
  try {
    const stored = JSON.parse(localStorage.getItem("customTheme") ?? "{}");
    document.documentElement.setAttribute("data-theme", "custom");
    for (const [k, v] of Object.entries(stored)) {
      document.documentElement.style.setProperty(k, v as string);
    }
    localStorage.setItem("theme", "custom");
  } catch { /* noop */ }
}

export function ThemeSwitcher() {
  const [current,       setCurrent]      = useState<ThemeId>("ambra");
  const [mode,          setMode]         = useState<Mode>("dark");
  const [open,          setOpen]         = useState(false);
  const [customize,     setCustomize]    = useState(false);
  const [customAccent,  setCustomAccent] = useState<string | null>(null);
  const [mounted,       setMounted]      = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Ripristina tema salvato all'avvio — solo client */
  useEffect(() => {
    setMounted(true);
    const savedMode = (localStorage.getItem("mode") ?? "dark") as Mode;
    setMode(savedMode);
    applyMode(savedMode);

    const saved = (localStorage.getItem("theme") ?? "ambra") as ThemeId;
    setCurrent(saved);
    if (saved === "custom") {
      applyCustom();
      /* Legge l'accento custom dopo l'applicazione */
      requestAnimationFrame(() => {
        const v = getComputedStyle(document.documentElement)
          .getPropertyValue("--accent").trim();
        setCustomAccent(v || "#888");
      });
    } else {
      applyPreset(saved);
    }
  }, []);

  function toggleMode() {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    applyMode(next);
  }

  /* Chiude il dropdown al click esterno */
  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  /* Non renderizza nulla finché non è montato (evita mismatch SSR) */
  if (!mounted) return null;

  function selectPreset(id: ThemeId) {
    setCurrent(id);
    setCustomAccent(null);
    applyPreset(id as string);
    setOpen(false);
  }

  function openCustomizer() {
    setOpen(false);
    setCustomize(true);
  }

  function onCustomizerClose() {
    setCustomize(false);
    const saved = (localStorage.getItem("theme") ?? "ambra") as ThemeId;
    setCurrent(saved);
    if (saved === "custom") {
      requestAnimationFrame(() => {
        const v = getComputedStyle(document.documentElement)
          .getPropertyValue("--accent").trim();
        setCustomAccent(v || "#888");
      });
    } else {
      setCustomAccent(null);
    }
  }

  const isCustom = current === "custom";
  const presetAccent = THEMES.find((t) => t.id === current)?.accent;
  const displayAccent = isCustom ? (customAccent ?? "#888") : (presetAccent ?? "#888");

  return (
    <>
      <div ref={ref} className="relative">
        {/* Trigger */}
        <button
          onClick={() => setOpen((p) => !p)}
          title="Cambia tema"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-200"
          style={{
            borderColor: "color-mix(in srgb, var(--fg-subtle) 30%, transparent)",
          }}
          aria-label="Seleziona tema colore"
        >
          <span
            className="w-3 h-3 rounded-full border border-white/20 shrink-0"
            style={{ background: displayAccent }}
          />
          <span className="text-xs hidden sm:block" style={{ color: "var(--fg-muted)" }}>
            {isCustom ? "Custom" : THEMES.find((t) => t.id === current)?.label}
          </span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
            style={{ color: "var(--fg-subtle)" }}
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown */}
        {open && (
          <div
            className="absolute right-0 top-full mt-2 z-50 p-2 rounded-xl shadow-2xl shadow-black/60 min-w-[168px]"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
            }}
          >
            {/* Toggle chiaro / scuro */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg mb-3"
              style={{ background: "color-mix(in srgb, var(--fg-subtle) 12%, transparent)" }}
            >
              {(["dark", "light"] as const).map((m) => (
                <button
                  key={m}
                  onClick={toggleMode}
                  className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all duration-200"
                  style={mode === m ? {
                    background: "var(--bg-card)",
                    color: "var(--fg-primary)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  } : {
                    color: "var(--fg-subtle)",
                  }}
                >
                  <span>{m === "dark" ? "🌙" : "☀️"}</span>
                  <span>{m === "dark" ? "Scuro" : "Chiaro"}</span>
                </button>
              ))}
            </div>

            {/* Griglia temi preset */}
            <div className="grid grid-cols-4 gap-1.5 mb-2">
              {THEMES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => selectPreset(t.id)}
                  title={t.label}
                  className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all duration-150
                    ${current === t.id
                      ? "bg-white/10 ring-1 ring-white/20"
                      : "hover:bg-white/5"}`}
                >
                  <span
                    className="w-5 h-5 rounded-full border border-white/15"
                    style={{ background: t.accent }}
                  />
                  <span className="text-[9px] leading-none" style={{ color: "var(--fg-subtle)" }}>
                    {t.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Separatore */}
            <div
              className="my-2 border-t"
              style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 15%, transparent)" }}
            />

            {/* Pulsante personalizza */}
            <button
              onClick={openCustomizer}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors"
              style={{ color: current === "custom" ? "var(--accent)" : "var(--fg-muted)" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "color-mix(in srgb, var(--accent) 8%, transparent)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <span>🎨</span>
              <span className="font-medium">
                {current === "custom" ? "Modifica tema custom" : "Personalizza colori…"}
              </span>
              {current === "custom" && (
                <span
                  className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={{ background: "var(--accent)", color: "var(--accent-on)" }}
                >
                  attivo
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Pannello customizer */}
      <ThemeCustomizer isOpen={customize} onClose={onCustomizerClose} />
    </>
  );
}

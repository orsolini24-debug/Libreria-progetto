"use client";

import { useState, useEffect } from "react";

/* ── Variabili esposte all'editor ─────────────────────────────────── */
const VARS = [
  { key: "--bg-page",      label: "Sfondo pagina",       group: "Sfondi" },
  { key: "--bg-card",      label: "Card / Pannelli",     group: "Sfondi" },
  { key: "--bg-elevated",  label: "Elementi in rilievo", group: "Sfondi" },
  { key: "--bg-input",     label: "Input / Select",      group: "Sfondi" },
  { key: "--fg-primary",   label: "Testo principale",    group: "Testi" },
  { key: "--fg-muted",     label: "Testo secondario",    group: "Testi" },
  { key: "--fg-subtle",    label: "Label / Testo tenue", group: "Testi" },
  { key: "--accent",       label: "Colore accento",      group: "Accento" },
  { key: "--accent-hover", label: "Accento al hover",    group: "Accento" },
  { key: "--accent-on",    label: "Testo su accento",    group: "Accento" },
] as const;

type VarKey = (typeof VARS)[number]["key"];
type ColorMap = Partial<Record<VarKey, string>>;

const GROUPS = ["Sfondi", "Testi", "Accento"] as const;
const STORAGE_KEY = "customTheme";

/* ── Utility ────────────────────────────────────────────────────────── */
function loadStored(): ColorMap {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}"); }
  catch { return {}; }
}

/** Converte qualsiasi formato CSS colore in #rrggbb tramite canvas. */
function toHex(cssColor: string): string {
  if (/^#[0-9a-f]{6}$/i.test(cssColor)) return cssColor;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = cssColor;
    ctx.fillRect(0, 0, 1, 1);
    const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
    return `#${[r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("")}`;
  } catch { return "#000000"; }
}

/** Legge il valore computato di una CSS variable. */
function readVar(key: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(key).trim();
}

/** Applica una variabile inline sull'elemento root. */
function applyVar(key: string, value: string) {
  document.documentElement.style.setProperty(key, value);
  if (key === "--bg-page")    document.documentElement.style.setProperty("--background", value);
  if (key === "--fg-primary") document.documentElement.style.setProperty("--foreground", value);
}

/* ── Componente ─────────────────────────────────────────────────────── */
export function ThemeCustomizer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [colors, setColors] = useState<ColorMap>({});

  /* Carica i valori correnti quando si apre il pannello */
  useEffect(() => {
    if (!isOpen) return;
    const stored = loadStored();
    const snapshot: ColorMap = {};
    for (const { key } of VARS) {
      snapshot[key] = stored[key] ?? toHex(readVar(key));
    }
    setColors(snapshot);
  }, [isOpen]);

  /* Chiude con Escape */
  useEffect(() => {
    if (!isOpen) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [isOpen, onClose]);

  function handleChange(key: VarKey, value: string) {
    setColors((prev) => ({ ...prev, [key]: value }));
    applyVar(key, value);
  }

  function handleSave() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(colors));
    localStorage.setItem("theme", "custom");
    document.documentElement.setAttribute("data-theme", "custom");
    /* Riapplica dopo il cambio di data-theme (che resetterebbe le cascade) */
    for (const { key } of VARS) {
      const v = colors[key];
      if (v) applyVar(key, v);
    }
    onClose();
  }

  function handleReset() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem("theme", "ambra");
    document.documentElement.setAttribute("data-theme", "ambra");
    document.documentElement.removeAttribute("style");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Pannello */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-xs z-50 flex flex-col shadow-2xl shadow-black/60"
        style={{
          background: "var(--bg-card)",
          borderLeft: "1px solid color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
        }}
      >
        {/* Intestazione */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)",
          }}
        >
          <div>
            <h2 className="font-display font-semibold text-sm" style={{ color: "var(--fg-primary)" }}>
              Personalizza colori
            </h2>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--fg-subtle)" }}>
              Le modifiche si applicano in tempo reale
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-xl leading-none w-7 h-7 flex items-center justify-center rounded-full transition-colors"
            style={{ color: "var(--fg-muted)" }}
          >
            ×
          </button>
        </div>

        {/* Colori */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {GROUPS.map((group) => (
            <div key={group}>
              <p
                className="text-[10px] font-semibold uppercase tracking-widest mb-3"
                style={{ color: "var(--fg-subtle)" }}
              >
                {group}
              </p>
              <div className="space-y-3">
                {VARS.filter((v) => v.group === group).map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between gap-2">
                    <label className="text-xs leading-none" style={{ color: "var(--fg-muted)" }}>
                      {label}
                    </label>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className="text-[10px] font-mono tabular-nums"
                        style={{ color: "var(--fg-subtle)" }}
                      >
                        {colors[key] ?? ""}
                      </span>
                      <div className="relative">
                        <input
                          type="color"
                          value={colors[key] ?? "#000000"}
                          onChange={(e) => handleChange(key, e.target.value)}
                          className="w-8 h-8 rounded-lg cursor-pointer opacity-0 absolute inset-0"
                          title={label}
                        />
                        <div
                          className="w-8 h-8 rounded-lg border-2 border-white/20 shadow-md pointer-events-none"
                          style={{ background: colors[key] ?? "transparent" }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Anteprima live */}
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest mb-3"
              style={{ color: "var(--fg-subtle)" }}
            >
              Anteprima
            </p>
            <div
              className="rounded-xl p-4 border space-y-2"
              style={{
                background: colors["--bg-card"] ?? "var(--bg-card)",
                borderColor: `color-mix(in srgb, ${colors["--accent"] ?? "var(--accent)"} 25%, transparent)`,
              }}
            >
              <p className="text-sm font-semibold" style={{ color: colors["--fg-primary"] ?? "var(--fg-primary)" }}>
                Titolo libro di esempio
              </p>
              <p className="text-xs" style={{ color: colors["--fg-muted"] ?? "var(--fg-muted)" }}>
                Autore Cognome · 2024
              </p>
              <div className="flex gap-2 mt-2">
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-semibold"
                  style={{
                    background: colors["--accent"] ?? "var(--accent)",
                    color: colors["--accent-on"] ?? "var(--accent-on)",
                  }}
                >
                  Accento
                </span>
                <span
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    color: colors["--fg-subtle"] ?? "var(--fg-subtle)",
                    borderColor: `color-mix(in srgb, ${colors["--fg-subtle"] ?? "var(--fg-subtle)"} 30%, transparent)`,
                  }}
                >
                  Tag
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 border-t flex gap-2 shrink-0"
          style={{ borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)" }}
        >
          <button
            onClick={handleSave}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
            style={{
              background: "var(--accent)",
              color: "var(--accent-on)",
            }}
          >
            Salva tema
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2.5 rounded-xl text-xs border transition-colors"
            style={{
              color: "var(--fg-subtle)",
              borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
            }}
            title="Ripristina tema Ambra"
          >
            Reset
          </button>
        </div>
      </div>
    </>
  );
}

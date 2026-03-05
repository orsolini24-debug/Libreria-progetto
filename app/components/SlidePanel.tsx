"use client";

import { useEffect, useRef } from "react";

interface SlidePanelProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function SlidePanel({ isOpen, onClose, title, children }: SlidePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  // #91: ESC key handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  // Bloocca scroll body
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  // #91: Simple Focus Trap
  useEffect(() => {
    if (isOpen && panelRef.current) {
      const focusableElements = panelRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  return (
    <>
      {/* #92: Backdrop con chiusura al click */}
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        onClick={(e) => e.stopPropagation()} // Evita chiusura cliccando sul pannello
        className={`fixed top-0 right-0 h-full w-full max-w-md border-l
          shadow-2xl shadow-black/60 z-50 flex flex-col transform transition-transform duration-300 ease-out
          ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        style={{
          background: "var(--bg-card)",
          borderColor: "color-mix(in srgb, var(--fg-subtle) 25%, transparent)",
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="panel-title"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b shrink-0"
          style={{
            background: "var(--bg-elevated)",
            borderColor: "color-mix(in srgb, var(--fg-subtle) 20%, transparent)",
          }}
        >
          <h2 id="panel-title" className="font-display font-semibold text-base tracking-tight" style={{ color: "var(--fg-primary)" }}>
            {title}
          </h2>
          {/* #76: Pulsante chiusura più grande e accessibile */}
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full transition-all hover:bg-white/5 active:scale-90"
            style={{ color: "var(--fg-muted)" }}
            aria-label="Chiudi pannello"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 scrollbar-hide">
          {children}
        </div>
      </div>
    </>
  );
}

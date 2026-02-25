"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface ISBNScanControls {
  stop: () => void;
}

interface Props {
  onDetected: (isbn: string) => void;
  onClose: () => void;
}

export function BarcodeScanner({ onDetected, onClose }: Props) {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<ISBNScanControls | null>(null);
  const [error,   setError]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const stop = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function start() {
      try {
        const { BrowserMultiFormatReader, BarcodeFormat } =
          await import("@zxing/browser");
        const { DecodeHintType } = await import("@zxing/library");

        if (cancelled) return;

        const hints = new Map();
        hints.set(DecodeHintType.POSSIBLE_FORMATS, [
          BarcodeFormat.EAN_13,
          BarcodeFormat.EAN_8,
          BarcodeFormat.UPC_A,
          BarcodeFormat.UPC_E,
          BarcodeFormat.CODE_128,
        ]);

        const reader = new BrowserMultiFormatReader(hints);

        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (devices.length === 0) {
          setError("Nessuna fotocamera trovata.");
          setLoading(false);
          return;
        }

        // Preferisce fotocamera posteriore
        const back = devices.find((d) =>
          /back|rear|poste/i.test(d.label)
        );
        const deviceId = back?.deviceId ?? devices[0].deviceId;

        setLoading(false);
        if (cancelled || !videoRef.current) return;

        const controls = await reader.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err) => {
            if (cancelled) return;
            if (result) {
              const text = result.getText().replace(/-/g, "");
              // EAN-13 con prefisso ISBN (978/979) o qualsiasi 10/13 cifre
              if (/^(978|979)\d{10}$/.test(text) || /^\d{13}$/.test(text)) {
                stop();
                onDetected(text);
              }
            }
            // Ignora NotFoundException (frame senza codice — normale)
            if (err && err.name !== "NotFoundException") {
              console.warn("[BarcodeScanner]", err.name);
            }
          }
        );

        controlsRef.current = controls;
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e);
          if (/[Pp]ermission/.test(msg)) {
            setError("Accesso alla fotocamera negato. Abilita i permessi nel browser.");
          } else {
            setError("Impossibile avviare la fotocamera.");
          }
          setLoading(false);
        }
      }
    }

    start();

    return () => {
      cancelled = true;
      stop();
    };
  }, [onDetected, stop]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{ background: "rgba(0,0,0,0.92)" }}
    >
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between px-4 py-3">
        <p className="text-sm font-semibold text-white">Scansiona barcode ISBN</p>
        <button
          onClick={() => { stop(); onClose(); }}
          className="text-white/60 hover:text-white transition-colors text-xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Viewfinder */}
      <div className="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border-2"
        style={{ borderColor: "var(--accent)" }}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Mirino centrale */}
        {!loading && !error && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-3/4 h-16 rounded-md border-2 border-dashed"
              style={{
                borderColor: "var(--accent)",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.45)",
              }}
            />
          </div>
        )}

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <p className="text-sm text-white/70">Avvio fotocamera…</p>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 px-6 py-3 rounded-xl border text-sm text-center max-w-sm"
          style={{ color: "#f87171", background: "color-mix(in srgb,#ef4444 10%,#000)", borderColor: "color-mix(in srgb,#ef4444 40%,transparent)" }}>
          {error}
        </div>
      )}

      <p className="mt-4 text-xs text-center px-6" style={{ color: "rgba(255,255,255,0.4)" }}>
        Posiziona il barcode del libro nell&apos;area tratteggiata.
        <br />Funziona con ISBN-13 (inizia con 978 o 979).
      </p>
    </div>
  );
}

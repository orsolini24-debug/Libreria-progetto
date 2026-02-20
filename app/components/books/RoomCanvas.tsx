/**
 * RoomCanvas — Client Component (drag & drop)
 *
 * Architettura posizionamento:
 * - Le coordinate x, y sono percentuali (0–100) relative al container.
 * - Salvare percentuali vs pixel: le percentuali sono responsive,
 *   il layout funziona a qualsiasi risoluzione.
 *
 * Drag & drop senza librerie esterne:
 * - mousedown sul libro → salva offsetX/Y (punto di presa)
 * - mousemove sul container → aggiorna posizione locale in state
 * - mouseup → chiama updateRoomPosition (Server Action)
 *
 * Stato locale vs server:
 * - Le posizioni vengono aggiornate ottimisticamente in locale (useState)
 *   durante il drag per avere un'animazione fluida senza attendere il server.
 * - Sul mouseup la Server Action persiste la posizione finale.
 *   Se la chiamata fallisce la posizione torna a quella dell'ultimo render
 *   al successivo refresh (trade-off accettabile per questa feature).
 *
 * Libri senza roomConfig ottengono una posizione iniziale deterministica
 * basata sull'index per evitare sovrapposizioni al primo caricamento.
 */
"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { updateRoomPosition } from "@/app/lib/book-actions";
import type { Book } from "@/app/generated/prisma/client";

type RoomConfig = { x: number; y: number; variant?: string };
type PositionMap = Record<string, { x: number; y: number }>;

function getInitialPositions(books: Book[]): PositionMap {
  return Object.fromEntries(
    books.map((book, i) => {
      const config = book.roomConfig as RoomConfig | null;
      return [
        book.id,
        {
          // Default: griglia 4 colonne, 20% di margine
          x: config?.x ?? 10 + (i % 4) * 22,
          y: config?.y ?? 10 + Math.floor(i / 4) * 28,
        },
      ];
    })
  );
}

const STATUS_COLORS: Record<string, string> = {
  TO_READ: "border-gray-300",
  READING: "border-blue-400",
  READ: "border-green-400",
  WISHLIST: "border-purple-400",
};

export function RoomCanvas({ books }: { books: Book[] }) {
  const [positions, setPositions] = useState<PositionMap>(() =>
    getInitialPositions(books)
  );

  // useRef per il dragging: non causa re-render durante il movimento
  const dragging = useRef<{
    id: string;
    startMouseX: number;
    startMouseY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  const onMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault(); // evita selezione testo durante drag
      const pos = positions[id];
      dragging.current = {
        id,
        startMouseX: e.clientX,
        startMouseY: e.clientY,
        startPosX: pos.x,
        startPosY: pos.y,
      };
    },
    [positions]
  );

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragging.current.startMouseX) / rect.width) * 100;
    const dy = ((e.clientY - dragging.current.startMouseY) / rect.height) * 100;

    const newX = Math.max(0, Math.min(90, dragging.current.startPosX + dx));
    const newY = Math.max(0, Math.min(85, dragging.current.startPosY + dy));

    setPositions((prev) => ({
      ...prev,
      [dragging.current!.id]: { x: newX, y: newY },
    }));
  }, []);

  const onMouseUp = useCallback(() => {
    if (!dragging.current) return;
    const { id } = dragging.current;
    const { x, y } = positions[id];
    dragging.current = null;

    // Fire-and-forget: non blocchiamo l'UI per la conferma server
    updateRoomPosition(id, Math.round(x * 10) / 10, Math.round(y * 10) / 10).catch(
      console.error
    );
  }, [positions]);

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-xl">
        Nessun libro nella stanza. Aggiungine uno dalla Dashboard.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-amber-50 rounded-xl border border-amber-100"
      style={{ height: "75vh", minHeight: "500px" }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp} // rilascia se il mouse esce dal container
    >
      {/* Sfondo scaffale decorativo */}
      <div className="absolute bottom-[30%] left-0 right-0 h-3 bg-amber-200 opacity-60 rounded" />
      <div className="absolute bottom-[58%] left-0 right-0 h-3 bg-amber-200 opacity-60 rounded" />

      {books.map((book) => {
        const pos = positions[book.id] ?? { x: 5, y: 5 };
        const colorClass = STATUS_COLORS[book.status] ?? "border-gray-300";

        return (
          <div
            key={book.id}
            onMouseDown={(e) => onMouseDown(book.id, e)}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              // translate(-50%, 0) centra il libro sul punto di ancoraggio
              transform: "translateX(-50%)",
              cursor: "grab",
              userSelect: "none",
            }}
            className="group"
            title={`${book.title}${book.author ? ` — ${book.author}` : ""}`}
          >
            {book.coverUrl ? (
              <Image
                src={book.coverUrl}
                alt={book.title}
                width={52}
                height={72}
                className={`rounded border-2 ${colorClass} shadow-md group-hover:shadow-lg transition-shadow`}
                draggable={false}
                unoptimized
              />
            ) : (
              // Libro senza copertina: "spina dorsale" verticale
              <div
                className={`w-10 h-16 bg-white rounded border-2 ${colorClass} shadow-md flex items-center justify-center`}
                style={{ writingMode: "vertical-lr" }}
              >
                <span className="text-[9px] text-gray-500 overflow-hidden whitespace-nowrap text-ellipsis max-h-14 px-0.5">
                  {book.title}
                </span>
              </div>
            )}

            {/* Tooltip al hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap max-w-[160px] truncate">
                {book.title}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/**
 * RoomCanvas — Client Component (drag & drop)
 *
 * Architettura posizionamento:
 * - Le coordinate x, y sono percentuali (0–100) relative al container.
 * - Salvare percentuali: responsive a qualsiasi risoluzione.
 *
 * Drag & drop senza librerie esterne:
 * - mousedown sul libro → salva offsetX/Y (punto di presa)
 * - mousemove sul container → aggiorna posizione locale in state
 * - mouseup → chiama updateRoomPosition (Server Action)
 *
 * Stato locale vs server:
 * - Le posizioni vengono aggiornate ottimisticamente durante il drag.
 * - Sul mouseup la Server Action persiste la posizione finale.
 */
"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { updateRoomPosition } from "@/app/lib/book-actions";
import type { Book } from "@/app/generated/prisma/client";

export type RoomBook = Pick<Book, "id" | "title" | "author" | "coverUrl" | "status" | "roomConfig">;

type RoomConfig = { x: number; y: number; variant?: string };
type PositionMap = Record<string, { x: number; y: number }>;

function getInitialPositions(books: RoomBook[]): PositionMap {
  return Object.fromEntries(
    books.map((book, i) => {
      const config = book.roomConfig as RoomConfig | null;
      return [
        book.id,
        {
          x: config?.x ?? 10 + (i % 4) * 22,
          y: config?.y ?? 10 + Math.floor(i / 4) * 28,
        },
      ];
    })
  );
}

const STATUS_COLORS: Record<string, string> = {
  TO_READ:  "border-stone-500",
  READING:  "border-blue-400",
  READ:     "border-emerald-400",
  WISHLIST: "border-violet-400",
};

export function RoomCanvas({ books }: { books: RoomBook[] }) {
  const [positions, setPositions] = useState<PositionMap>(() =>
    getInitialPositions(books)
  );

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
      e.preventDefault();
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

    updateRoomPosition(id, Math.round(x * 10) / 10, Math.round(y * 10) / 10).catch(
      console.error
    );
  }, [positions]);

  if (books.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-stone-500 text-sm
        border-2 border-dashed border-stone-700 rounded-xl">
        Nessun libro nella stanza. Aggiungine uno dalla Dashboard.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-xl border border-stone-700/50 overflow-hidden"
      style={{
        height: "75vh",
        minHeight: "500px",
        background: "radial-gradient(ellipse at 50% 100%, #1c1410 0%, #0c0a08 70%)",
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* Scaffali decorativi */}
      <div className="absolute bottom-[30%] left-0 right-0 h-2 bg-amber-900/50 rounded shadow-sm shadow-amber-950" />
      <div className="absolute bottom-[58%] left-0 right-0 h-2 bg-amber-900/50 rounded shadow-sm shadow-amber-950" />
      {/* Riflesso pavimento */}
      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-amber-950/20 to-transparent pointer-events-none" />

      {books.map((book) => {
        const pos = positions[book.id] ?? { x: 5, y: 5 };
        const colorClass = STATUS_COLORS[book.status] ?? "border-stone-500";

        return (
          <div
            key={book.id}
            onMouseDown={(e) => onMouseDown(book.id, e)}
            style={{
              position: "absolute",
              left: `${pos.x}%`,
              top: `${pos.y}%`,
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
                className={`rounded border-2 ${colorClass} shadow-lg shadow-black/60 group-hover:shadow-xl group-hover:shadow-black/80 group-hover:-translate-y-1 transition-all duration-150`}
                draggable={false}
                unoptimized
              />
            ) : (
              <div
                className={`w-10 h-16 bg-stone-800 rounded border-2 ${colorClass} shadow-md flex items-center justify-center`}
                style={{ writingMode: "vertical-lr" }}
              >
                <span className="text-[9px] text-stone-400 overflow-hidden whitespace-nowrap text-ellipsis max-h-14 px-0.5">
                  {book.title}
                </span>
              </div>
            )}

            {/* Tooltip al hover */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-stone-950 border border-stone-700 text-stone-200 text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap max-w-[180px] truncate shadow-xl">
                {book.title}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

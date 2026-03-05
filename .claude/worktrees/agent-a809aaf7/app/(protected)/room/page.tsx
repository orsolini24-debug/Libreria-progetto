/**
 * app/(protected)/room/page.tsx — Server Component shell
 *
 * Recupera i libri server-side e li passa a RoomCanvas (Client Component).
 * Pattern "Server shell + Client leaf":
 * - HTML iniziale con dati già renderizzati (no loading state)
 * - Solo RoomCanvas viene idratato per gestire drag & drop
 */
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { RoomCanvas } from "@/app/components/books/RoomCanvas";
import type { RoomBook } from "@/app/components/books/RoomCanvas";

const STATUS_LEGEND = [
  { label: "Da leggere", color: "border-stone-500" },
  { label: "In lettura", color: "border-blue-400" },
  { label: "Letto",      color: "border-emerald-400" },
  { label: "Wishlist",   color: "border-violet-400" },
];

export default async function RoomPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, title: true, author: true,
      coverUrl: true, status: true, roomConfig: true,
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-100 tracking-tight">La tua stanza</h1>
          <p className="text-sm text-stone-500 mt-1">
            Trascina i libri per riorganizzare la stanza
          </p>
        </div>
        <span className="text-xs text-stone-400 bg-stone-800 border border-stone-700 rounded-full px-3 py-1">
          {books.length} {books.length === 1 ? "libro" : "libri"}
        </span>
      </div>

      <RoomCanvas books={books as RoomBook[]} />

      {/* Legenda stati */}
      <div className="mt-4 flex gap-4 flex-wrap text-xs text-stone-500">
        {STATUS_LEGEND.map(({ label, color }) => (
          <span key={label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded border-2 ${color} inline-block`} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}

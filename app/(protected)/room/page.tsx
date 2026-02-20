/**
 * app/(protected)/room/page.tsx — Server Component shell
 *
 * Recupera i libri server-side e li passa a RoomCanvas (Client Component).
 * Questo è il pattern "Server shell + Client leaf":
 * - L'HTML iniziale con i dati arriva già renderizzato (no loading state)
 * - Solo RoomCanvas viene idratato per gestire drag & drop
 * - prisma.book.findMany NON va nella cache statica perché la pagina
 *   è dinamica (dipende dalla sessione dell'utente)
 *
 * Nota: RoomCanvas usa posizioni locali (useState) per l'animazione
 * fluida e chiama updateRoomPosition solo al mouseup per persistere.
 */
import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import { RoomCanvas } from "@/app/components/books/RoomCanvas";

export default async function RoomPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" }, // ordine stabile per posizioni default
    select: {
      id: true,
      title: true,
      author: true,
      coverUrl: true,
      status: true,
      roomConfig: true,
      comment: true,
      description: true,
      userId: true,
      googleId: true,
      isbn: true,
      publisher: true,
      publishedDate: true,
      language: true,
      pageCount: true,
      rating: true,
      tags: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">La tua stanza</h1>
          <p className="text-sm text-gray-500 mt-1">
            Trascina i libri per riorganizzare la stanza
          </p>
        </div>
        <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1">
          {books.length} libri
        </span>
      </div>

      <RoomCanvas books={books} />

      {/* Legenda stati */}
      <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-gray-300 inline-block" />
          Da leggere
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-blue-400 inline-block" />
          In lettura
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-green-400 inline-block" />
          Letto
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded border-2 border-purple-400 inline-block" />
          Wishlist
        </span>
      </div>
    </div>
  );
}

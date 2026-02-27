import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/app/lib/prisma";
import { QuotesClient } from "./QuotesClient";

export default async function CitazioniPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [quotes, userBooks] = await Promise.all([
    prisma.quote.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        book: { select: { id: true, title: true, author: true, coverUrl: true } },
      },
    }),
    prisma.book.findMany({
      where: { userId: session.user.id },
      orderBy: { title: "asc" },
      select: { id: true, title: true, author: true, status: true },
    }),
  ]);

  // Lista unica di libri che hanno citazioni, per i chip filtro
  const booksWithQuotes = Array.from(
    new Map(quotes.map((q) => [q.book.id, q.book])).values(),
  );

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display font-bold text-2xl" style={{ color: "var(--fg-primary)" }}>
          Le tue citazioni
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--fg-muted)" }}>
          {quotes.length} {quotes.length === 1 ? "citazione salvata" : "citazioni salvate"}
        </p>
      </div>

      <QuotesClient quotes={quotes} booksWithQuotes={booksWithQuotes} userBooks={userBooks} />
    </div>
  );
}

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

const STATUS_IT: Record<string, string> = {
  TO_READ:  "Da leggere",
  READING:  "In lettura",
  READ:     "Letto",
  WISHLIST: "Wishlist",
};

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const userId = session.user.id;
  const format = req.nextUrl.searchParams.get("format") ?? "json";

  const books = await prisma.book.findMany({
    where: { userId },
    include: {
      quotes: true,
      loans: true,
      readingSessions: true,
    },
    orderBy: { updatedAt: "desc" },
  });

  if (format === "csv") {
    const headers = [
      "Titolo", "Autore", "Stato", "Valutazione", "Pagine", "Pagina corrente",
      "Serie", "Numero serie", "ISBN", "Editore", "Note", "Acquistato il",
      "Citazioni (tot)", "Prestiti (tot)", "Sessioni (tot)"
    ];

    const escape = (v: unknown) => {
      const s = v == null ? "" : String(v);
      return s.includes(",") || s.includes('"') || s.includes("\n")
        ? `"${s.replace(/"/g, '""')}"`
        : s;
    };

    const rows = books.map((b) => [
      escape(b.title),
      escape(b.author),
      escape(STATUS_IT[b.status] ?? b.status),
      escape(b.rating),
      escape(b.pageCount),
      escape(b.currentPage),
      escape(b.series),
      escape(b.seriesOrder),
      escape(b.isbn),
      escape(b.publisher),
      escape(b.comment),
      escape(b.purchasedAt?.toISOString().slice(0, 10)),
      escape(b.quotes.length),
      escape(b.loans.length),
      escape(b.readingSessions.length),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const bom = "\uFEFF";

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="libreria-full-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON (full dump)
  return new NextResponse(JSON.stringify(books, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="libreria-full-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { logger } from "@/app/lib/logger";

const STATUS_IT: Record<string, string> = {
  TO_READ:   "Da leggere",
  READING:   "In lettura",
  READ:      "Letto",
  WISHLIST:  "Wishlist",
  ABANDONED: "Abbandonato", // #119: Aggiunto status mancante
};

export async function GET(req: NextRequest) {
  try {
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
      // #105: Whitelist esplicita dei campi
      const headers = [
        "Titolo", "Autore", "Stato", "Valutazione", "Pagine", "Pagina corrente",
        "Serie", "Numero serie", "ISBN", "Editore", "Note", "Acquistato il",
        "Citazioni (tot)", "Prestiti (tot)", "Sessioni (tot)"
      ];

      // #41, #112: Escape CSV robusto (gestione newline e doppi apici)
      const escape = (v: unknown) => {
        if (v === null || v === undefined) return "";
        const s = String(v).replace(/\r?\n|\r/g, " "); // Sostituisce newline con spazio per compatibilità CSV
        return s.includes(",") || s.includes('"')
          ? `"${s.replace(/"/g, '""')}"`
          : s;
      };

      const rows = books.map((b) => [
        escape(b.title),
        escape(b.author),
        escape(STATUS_IT[b.status] ?? b.status),
        escape(b.rating ?? "0"), // #25: Default 0 per rating
        escape(b.pageCount ?? "0"),
        escape(b.currentPage ?? "0"),
        escape(b.series),
        escape(b.seriesOrder),
        escape(b.isbn),
        escape(b.publisher),
        escape(b.comment),
        escape(b.purchasedAt?.toISOString().slice(0, 10)),
        escape(b.quotes.length || "0"), // #25: Mostra "0" invece di vuoto
        escape(b.loans.length || "0"),
        escape(b.readingSessions.length || "0"),
      ].join(","));

      const csv = [headers.join(","), ...rows].join("\n");
      const bom = "\uFEFF"; // Byte Order Mark per Excel (UTF-8)

      return new NextResponse(bom + csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="libreria-full-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      });
    }

    // JSON (full dump) - Whitelist implicita via spread per semplicità, ma i campi sono già filtrati da findMany
    return new NextResponse(JSON.stringify(books, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="libreria-full-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (e) {
    logger.error("EXPORT_ERROR", e);
    return NextResponse.json({ error: "Errore durante l'esportazione" }, { status: 500 });
  }
}

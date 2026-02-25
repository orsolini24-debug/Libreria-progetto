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

  const format = req.nextUrl.searchParams.get("format") ?? "json";

  const books = await prisma.book.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (format === "csv") {
    const headers = [
      "Titolo", "Autore", "Stato", "Valutazione", "Pagine", "Pagina corrente",
      "Serie", "Numero serie", "ISBN", "Editore", "Anno", "Lingua",
      "Formato", "Tag", "Note",
      "Acquistato il", "Iniziato il", "Finito il",
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
      escape(b.publishedDate?.slice(0, 4)),
      escape(b.language),
      escape(b.formats),
      escape(b.tags),
      escape(b.comment),
      escape(b.purchasedAt ? b.purchasedAt.toISOString().slice(0, 10) : ""),
      escape(b.startedAt   ? b.startedAt.toISOString().slice(0, 10)   : ""),
      escape(b.finishedAt  ? b.finishedAt.toISOString().slice(0, 10)  : ""),
    ].join(","));

    const csv = [headers.join(","), ...rows].join("\n");
    const bom = "\uFEFF"; // BOM UTF-8 — Excel lo legge correttamente

    return new NextResponse(bom + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="libreria-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON (default)
  const payload = books.map((b) => ({
    title:         b.title,
    author:        b.author,
    status:        STATUS_IT[b.status] ?? b.status,
    rating:        b.rating,
    pageCount:     b.pageCount,
    currentPage:   b.currentPage,
    series:        b.series,
    seriesOrder:   b.seriesOrder,
    isbn:          b.isbn,
    publisher:     b.publisher,
    publishedDate: b.publishedDate,
    language:      b.language,
    formats:       b.formats,
    tags:          b.tags,
    comment:       b.comment,
    coverUrl:      b.coverUrl,
    googleId:      b.googleId,
    purchasedAt:   b.purchasedAt,
    startedAt:     b.startedAt,
    finishedAt:    b.finishedAt,
    createdAt:     b.createdAt,
    updatedAt:     b.updatedAt,
  }));

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="libreria-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

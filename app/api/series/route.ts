import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/series?name=X&excludeId=Y
// Restituisce i libri dell'utente con la stessa serie (esclude il libro corrente)
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const name      = req.nextUrl.searchParams.get("name")?.trim();
  const excludeId = req.nextUrl.searchParams.get("excludeId") ?? "";

  if (!name || name.length < 2) return NextResponse.json([]);

  const books = await prisma.book.findMany({
    where: {
      userId: session.user.id,
      series: { contains: name, mode: "insensitive" },
      id:     { not: excludeId },
    },
    orderBy: { seriesOrder: "asc" },
    select: {
      id: true, title: true, author: true, coverUrl: true,
      series: true, seriesOrder: true, status: true,
    },
  });

  return NextResponse.json(books);
}

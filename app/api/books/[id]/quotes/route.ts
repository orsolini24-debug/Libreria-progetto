import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id: bookId } = await params;

  // #5, #111: Ownership check esplicito sul libro
  const book = await prisma.book.findFirst({
    where: { id: bookId, userId },
    select: { id: true }
  });

  if (!book) {
    return NextResponse.json({ error: "Libro non trovato o non autorizzato" }, { status: 403 });
  }

  const quotes = await prisma.quote.findMany({
    where: { bookId, userId },
    orderBy: { createdAt: "asc" },
    select: { id: true, text: true, page: true, chapter: true, createdAt: true, type: true },
  });

  return NextResponse.json(quotes);
}

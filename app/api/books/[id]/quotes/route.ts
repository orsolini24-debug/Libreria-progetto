import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
  }

  const { id: bookId } = await params;

  const book = await prisma.book.findFirst({
    where: { id: bookId, userId: session.user.id },
  });
  if (!book) return NextResponse.json({ error: "Non trovato" }, { status: 404 });

  const quotes = await prisma.quote.findMany({
    where: { bookId, userId: session.user.id },
    orderBy: { createdAt: "asc" },
    select: { id: true, text: true, page: true, chapter: true, createdAt: true },
  });

  return NextResponse.json(quotes);
}

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

  // [GEMINI-ARCH] - Motivo: Riduzione roundtrip DB (N+1 ridotto) - Fine ultimo: Migliore performance serverless
  const sessions = await prisma.readingSession.findMany({
    where:   { bookId, userId: session.user.id },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(sessions);
}

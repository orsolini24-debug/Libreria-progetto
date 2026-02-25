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

  // [GEMINI-ARCH] - Motivo: Consolidamento query - Fine ultimo: Efficienza DB
  const loans = await prisma.loan.findMany({
    where: { bookId, userId: session.user.id },
    orderBy: { loanedAt: "desc" },
  });

  return NextResponse.json(loans);
}

import { NextRequest, NextResponse } from "next/server";
import { searchBooks } from "@/app/lib/api/google-books";
import { auth } from "@/auth";
import { logger } from "@/app/lib/logger";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autenticato" }, { status: 401 });
    }

    const q = req.nextUrl.searchParams.get("q") || "";
    const maxResults = Math.min(parseInt(req.nextUrl.searchParams.get("maxResults") || "20"), 20);

    // #108: Limitazione lunghezza query (max 200 caratteri)
    if (q.length > 200) {
      return NextResponse.json({ error: "Query troppo lunga" }, { status: 400 });
    }

    if (!q.trim()) {
      return NextResponse.json([]);
    }

    const results = await searchBooks(q, maxResults);
    return NextResponse.json(results);
  } catch (error) {
    logger.error("SEARCH_ROUTE_ERROR", error);
    return NextResponse.json({ error: "Errore durante la ricerca" }, { status: 500 });
  }
}

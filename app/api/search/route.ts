// GET /api/search?q=<query> — ricerca libri tramite Google Books API
import { searchBooks } from "@/app/lib/api/google-books";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json([]);
  }

  try {
    const results = await searchBooks(q);
    return NextResponse.json(results, {
      headers: {
        // Cache 5 minuti: bilancio freschezza/performance
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

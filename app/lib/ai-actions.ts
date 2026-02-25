"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

export async function getProactiveInsights() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const userId = session.user.id;

  try {
    // 1. Raccogliamo i dati per l'analisi
    const [recentSessions, recentQuotes, topBooks] = await Promise.all([
      prisma.readingSession.findMany({
        where: { userId },
        orderBy: { date: "desc" },
        take: 5,
        include: { book: { select: { id: true, title: true, author: true } } }
      }),
      prisma.quote.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { book: { select: { id: true, title: true } } }
      }),
      prisma.book.findMany({
        where: { userId, status: { in: ["READING", "READ"] } },
        orderBy: { updatedAt: "desc" },
        take: 10,
        select: { id: true, title: true, author: true, tags: true, description: true, rating: true }
      })
    ]);

    if (topBooks.length === 0) return null;

    // 2. Prepariamo il prompt per Gemini
    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });
    
    const context = {
      sessions: recentSessions.map(s => `ID:${s.bookId} | Libro: ${s.book.title}, Note: ${s.note || "Nessuna"}`),
      quotes: recentQuotes.map(q => `ID:${q.bookId} | Libro: ${q.book.title}, Citazione: "${q.text}"`),
      library: topBooks.map(b => `ID:${b.id} | ${b.title} (${b.author}) - Tag: ${b.tags || "N/A"}`)
    };

    const prompt = `
      Sei un assistente letterario empatico e intelligente chiamato "Gemini Companion".
      Analizza questi dati della libreria di un utente e proponi un "Insight" proattivo.
      
      Dati recenti:
      - Ultime sessioni: ${context.sessions.join("; ")}
      - Ultime citazioni: ${context.quotes.join("; ")}
      - Libri letti/in lettura: ${context.library.join("; ")}

      REGOLE:
      1. Sii breve (massimo 2 frasi).
      2. Non fare domande generiche ("Cosa vuoi leggere oggi?"), proponi qualcosa di specifico basato sui pattern.
      3. Se suggerisci di riprendere o approfondire un libro, includi il suo ID specifico dai dati forniti.
      4. Restituisci un JSON con questa struttura: { "text": "string", "suggestedBookId": "string|null" }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return JSON.parse(response.text());
  } catch (error) {
    console.error("[getProactiveInsights]", error);
    return null;
  }
}

/**
 * Calcola lo streak di lettura attuale basato sulle sessioni.
 */
export async function getReadingStreak() {
  const session = await auth();
  if (!session?.user?.id) return 0;
  const userId = session.user.id;

  const sessions = await prisma.readingSession.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true }
  });

  if (sessions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const currentDate = new Date(today);
  const uniqueDates = new Set(sessions.map(s => {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }));

  // Se non ha letto oggi, controlliamo se ha letto ieri per mantenere lo streak
  if (!uniqueDates.has(currentDate.getTime())) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (uniqueDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

/**
 * Genera un'analisi specifica per un singolo libro basata sulle sessioni e citazioni.
 */
export async function getBookInsights(bookId: string) {
  const session = await auth();
  if (!session?.user?.id) return null;

  try {
    const book = await prisma.book.findUnique({
      where: { id: bookId, userId: session.user.id },
      include: {
        readingSessions: { orderBy: { date: "desc" }, take: 5 },
        quotes: { orderBy: { createdAt: "desc" }, take: 5 }
      }
    });

    if (!book) return null;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const context = {
      title: book.title,
      sessions: book.readingSessions.map(s => s.note).filter(Boolean),
      quotes: book.quotes.map(q => q.text)
    };

    if (context.sessions.length === 0 && context.quotes.length === 0) return null;

    const prompt = `
      Analizza questi dati per il libro "${context.title}".
      Sessioni di lettura (note): ${context.sessions.join("; ")}
      Citazioni salvate: ${context.quotes.join("; ")}

      Cosa suggerisce questo sul rapporto dell'utente con il libro? 
      Sii breve (1 frase). Proponi una riflessione o una curiosità.
      Non usare introduzioni.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (err) {
    console.error(err);
    return null;
  }
}


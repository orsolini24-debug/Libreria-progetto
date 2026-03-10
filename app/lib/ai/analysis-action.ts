"use server";

import { auth } from "@/auth";
import { prisma } from "@/app/lib/prisma";
import { generateText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { getUserFullContext } from "./context";
import { revalidatePath } from "next/cache";
import { logger } from "@/app/lib/logger";

type AnalysisResult = { success: true; analysis: string } | { success: false; error: string };

export async function generateBookAnalysis(bookId: string): Promise<AnalysisResult> {
  const session = await auth();
  if (!session?.user?.id) return { success: false, error: "Non autorizzato" };
  const userId = session.user.id;

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return { success: false, error: "Servizio AI non disponibile" };

  // 1. Recupera dati libro e contesto utente
  const [book, userContext] = await Promise.all([
    prisma.book.findFirst({ where: { id: bookId, userId } }),
    getUserFullContext(userId)
  ]);

  if (!book) return { success: false, error: "Libro non trovato" };

  try {
    // 2. Generazione con AI
    const groq = createGroq({ apiKey: apiKey.trim() });

    const { text } = await generateText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: groq("llama-3.3-70b-versatile") as any,
      system: `Sei "Sanctuary", un critico letterario empatico e un analista di anime.
Il tuo compito è scrivere un'analisi profonda di un libro specifica per QUESTO utente.
Usa il contesto fornito (libri letti, citazioni, stato emotivo) per creare un ponte tra il libro e la vita del lettore.

STRUTTURA DELL'ANALISI:
1. IL SIGNIFICATO PER TE (1 paragrafo): Perché questo libro risuona con il tuo stato attuale o i tuoi interessi.
2. TEMI E ARCHETIPI (1 paragrafo): Analisi dei temi profondi (non la trama).
3. CONNESSIONI (1 paragrafo): Come si collega ad altri libri della sua libreria.

REGOLE:
- Tono: Intimo, intellettuale, mai banale.
- Lingua: Italiano.
- NON riassumere la trama. L'utente la conosce già.
- Max 1500 caratteri.`,
      prompt: `
LIBRO DA ANALIZZARE: "${book.title}" di ${book.author}
TRAMA CONOSCIUTA: ${book.description || "N/A"}

CONTESTO UTENTE:
- Ultimi pensieri: ${userContext.recentCheckIns.join(" | ")}
- Libri in lettura: ${userContext.readingBooks.join(", ")}
- Temi ricorrenti nel profilo: ${userContext.thematicAxes.map(a => a.name).join(", ")}
- Citazioni salvate: ${userContext.recentQuotes.map(q => q.text).slice(0,3).join(" | ")}
    `
    });

    // 3. Salva nel DB
    await prisma.book.update({
      where: { id: bookId, userId },
      data: { aiAnalysis: text }
    });

    revalidatePath("/dashboard");
    return { success: true, analysis: text };
  } catch (e) {
    logger.error("GENERATE_ANALYSIS_ERROR", e);
    return { success: false, error: "Errore durante la generazione dell'analisi. Riprova." };
  }
}

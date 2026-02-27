import { auth } from "@/auth";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { orchestrate } from "@/app/lib/ai/orchestrator";
import { buildSystemPrompt, buildDeveloperPrompt } from "@/app/lib/ai/prompts";
import { getUserFullContext } from "@/app/lib/ai/context";
import { prisma } from "@/app/lib/prisma";
import { searchBooks } from "@/app/lib/api/google-books";

export const maxDuration = 60;

const ChatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }),
  ),
  currentBookId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return new Response("SERVER ERROR: GROQ_API_KEY undefined.", { status: 500 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Utente non autenticato.", { status: 401 });
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response("Richiesta non valida.", { status: 400 });
    }

    const { messages, currentBookId } = parsed.data;
    const userId = session.user.id;

    // Estrae l'ultimo messaggio dell'utente per l'orchestratore
    const lastUserMessage =
      messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

    // 1. Orchestrazione: intent detection + stance weights
    const orchestration = orchestrate(lastUserMessage);

    // 2. Carica contesto utente e libro corrente in parallelo
    const [userContext, currentBook] = await Promise.all([
      getUserFullContext(userId),
      currentBookId
        ? prisma.book.findFirst({
            where: { id: currentBookId, userId },
            select: {
              title: true,
              author: true,
              currentPage: true,
              pageCount: true,
              status: true,
              comment: true,
              tags: true,
              rating: true,
            },
          })
        : Promise.resolve(null),
    ]);

    // 3. Costruisce i prompt
    const systemPrompt = buildSystemPrompt();
    const developerPrompt = buildDeveloperPrompt(orchestration, userContext, currentBook);

    // 4. Streaming
    const groq = createGroq({ apiKey: apiKey.trim() });

    const result = await streamText({
      model: groq("moonshotai/kimi-k2-instruct-0905"),
      system: `${systemPrompt}\n\n---\n\n${developerPrompt}`,
      messages,
      maxSteps: 3,
      tools: {
        searchBook: {
          description:
            "Cerca informazioni aggiornate su un libro tramite Google Books. " +
            "Usalo quando: l'utente menziona un titolo che non conosci o che potrebbe essere stato pubblicato dopo il tuo training cutoff (2023); " +
            "hai dubbi su autore, anno di pubblicazione, trama o categorie di un libro; " +
            "l'utente chiede di libri del 2024 o 2025. " +
            "NON usarlo per libri classici o famosi che conosci già con certezza.",
          parameters: z.object({
            query: z
              .string()
              .describe("Titolo del libro e/o nome dell'autore, es. 'Le otto montagne Cognetti'"),
          }),
          execute: async ({ query }) => {
            const results = await searchBooks(query);
            if (results.length === 0) {
              return { found: false, message: "Nessun risultato trovato su Google Books." };
            }
            return {
              found: true,
              results: results.slice(0, 3).map((b) => ({
                title: b.title,
                author: b.author,
                publishedDate: b.publishedDate,
                description: b.description
                  ? b.description.slice(0, 400) + (b.description.length > 400 ? "…" : "")
                  : "",
                categories: b.categories,
                pageCount: b.pageCount || undefined,
              })),
            };
          },
        },
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err) =>
        `STREAM ERROR: ${err instanceof Error ? err.message : JSON.stringify(err)}`,
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    const msg = error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(`CHAT ERROR: ${msg}`, { status: 500 });
  }
}

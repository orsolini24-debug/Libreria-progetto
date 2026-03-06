import { auth } from "@/auth";
import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { z } from "zod";
import { orchestrate } from "@/app/lib/ai/orchestrator";
import { buildSystemPrompt, buildDeveloperPrompt } from "@/app/lib/ai/prompts";
import { getUserFullContext } from "@/app/lib/ai/context";
import { prisma } from "@/app/lib/prisma";
import { searchBooks } from "@/app/lib/api/google-books";
import { logger } from "@/app/lib/logger";

export const maxDuration = 60;

const RATE_LIMIT_MS = 2000;
const lastRequestMap = new Map<string, number>();

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
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new Response("Utente non autenticato.", { status: 401 });
    }

    const now = Date.now();
    const lastRequest = lastRequestMap.get(userId) || 0;
    if (now - lastRequest < RATE_LIMIT_MS) {
      return new Response("Troppe richieste. Riprova tra un istante.", { status: 429 });
    }
    lastRequestMap.set(userId, now);

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      logger.error("GROQ_API_KEY_MISSING", null);
      return new Response("Errore di configurazione del server AI.", { status: 500 });
    }

    const body = await req.json();
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return new Response("Richiesta non valida.", { status: 400 });
    }

    const { messages, currentBookId } = parsed.data;

    // #58, #163: Salviamo l'ultimo messaggio dell'utente nel DB
    const lastMessage = messages[messages.length - 1];
    if (lastMessage && lastMessage.role === "user") {
      try {
        await prisma.chatMessage.create({
          data: {
            userId,
            role: "user",
            content: lastMessage.content,
          }
        });
      } catch (e) {
        logger.error("SAVE_USER_MESSAGE_ERROR", e);
      }
    }

    const lastUserMessageContent =
      messages.filter((m) => m.role === "user").at(-1)?.content ?? "";

    const orchestration = orchestrate(lastUserMessageContent);

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

    const systemPrompt = buildSystemPrompt();
    const developerPrompt = buildDeveloperPrompt(orchestration, userContext, currentBook);

    const groq = createGroq({ apiKey: apiKey.trim() });

    const result = await streamText({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      model: groq("llama-3.3-70b-versatile") as any,
      system: `${systemPrompt}\n\n---\n\n${developerPrompt}`,
      messages,
      maxSteps: 3,
      onFinish: async ({ text }) => {
        try {
          await prisma.chatMessage.create({
            data: {
              userId,
              role: "assistant",
              content: text,
            }
          });
        } catch (e) {
          logger.error("SAVE_CHAT_RESPONSE_ERROR", e);
        }
      },
      tools: {
        searchBook: {
          description: "Cerca informazioni su un libro tramite Google Books.",
          parameters: z.object({
            query: z.string().describe("Titolo del libro e/o autore"),
          }),
          execute: async ({ query }) => {
            const results = await searchBooks(query);
            return {
              found: results.length > 0,
              results: results.slice(0, 3).map((b) => ({
                title: b.title,
                author: b.author,
                publishedDate: b.publishedDate,
                description: b.description?.slice(0, 400),
                categories: b.categories,
              })),
            };
          },
        },
        updateBookAnalysis: {
          description: "Aggiorna l'analisi tematica e stilistica di un libro.",
          parameters: z.object({
            bookId: z.string().describe("L'ID del libro"),
            analysis: z.string().describe("Il testo dell'analisi"),
          }),
          execute: async ({ bookId, analysis }) => {
            try {
              await prisma.book.update({
                where: { id: bookId, userId },
                data: { aiAnalysis: analysis },
              });
              return { success: true, message: "Analisi salvata." };
            } catch {
              return { success: false, message: "Errore salvataggio." };
            }
          },
        },
      },
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err) => {
        logger.error("STREAM_ERROR", err);
        return "Errore durante la generazione.";
      }
    });
  } catch (error) {
    logger.error("CHAT_API_ERROR", error);
    return new Response("Errore imprevisto.", { status: 500 });
  }
}

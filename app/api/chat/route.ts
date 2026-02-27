import { auth } from "@/auth";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { orchestrate } from "@/app/lib/ai/orchestrator";
import { buildSystemPrompt, buildDeveloperPrompt } from "@/app/lib/ai/prompts";
import { getUserFullContext } from "@/app/lib/ai/context";
import { prisma } from "@/app/lib/prisma";

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
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return new Response("SERVER ERROR: GOOGLE_AI_API_KEY undefined.", { status: 500 });
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
    const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey.trim() });

    const result = await streamText({
      model: googleProvider("gemini-2.0-flash"),
      system: `${systemPrompt}\n\n---\n\n${developerPrompt}`,
      messages,
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

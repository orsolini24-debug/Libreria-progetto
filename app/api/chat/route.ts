import { auth } from "@/auth";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getUserEmotionalContext } from "@/app/lib/emotional-actions";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. Controllo esplicito chiave a runtime
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return new Response("SERVER ERROR: La variabile GOOGLE_AI_API_KEY è undefined su Vercel.", { status: 500 });
    }

    const session = await auth();
    if (!session?.user?.id) {
      return new Response("SERVER ERROR: Utente non autenticato.", { status: 401 });
    }

    const { messages } = await req.json();
    const emotionalContext = await getUserEmotionalContext(session.user.id);

    // Inizializzazione sicura
    const googleProvider = createGoogleGenerativeAI({
      apiKey: apiKey.trim(),
    });

    const systemPrompt = `Sei un assistente empatico. Contesto utente: ${emotionalContext}`;

    const result = await streamText({
      model: googleProvider('gemini-1.5-pro'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse();
    
  } catch (error) {
    // DIAGNOSTICA: Catturiamo l'oggetto errore di Google e lo spariamo al frontend
    console.error("DIAGNOSTIC CRASH:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(`GOOGLE API ERROR: ${errorMessage}`, { status: 500 });
  }
}
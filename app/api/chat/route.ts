import { auth } from "@/auth";
import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { getUserEmotionalContext } from "@/app/lib/emotional-actions";

export const maxDuration = 30;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

  const { messages } = await req.json();
  const emotionalContext = await getUserEmotionalContext(session.user.id);

  const systemPrompt = `
    Sei un assistente ibrido: un caro Amico, un Terapeuta Letterario e un Bibliotecario Onnisciente.
    REGOLE ASSOLUTE:
    1. ASCOLTA E COMPRENDI PRIMA DI PROPORRE. Fai domande aperte, esplora come si sente l'utente.
    2. NON proporre subito un libro o una citazione, a meno che l'utente non lo chieda esplicitamente o non sia evidente che ne abbia bisogno ora.
    3. Fai sentire l'utente a casa, compreso e mai giudicato.
    4. Ecco il contesto emotivo e letterario attuale dell'utente:
    ${emotionalContext}
    Usa queste informazioni per personalizzare le tue risposte e fargli capire che lo conosci bene.
  `;

  const result = await streamText({
    model: google("gemini-1.5-pro"), // Usiamo il modello pro per ragionamenti complessi
    system: systemPrompt,
    messages,
  });

  return result.toAIStreamResponse();
}
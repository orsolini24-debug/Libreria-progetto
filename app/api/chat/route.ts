import { auth } from "@/auth";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getUserEmotionalContext } from "@/app/lib/emotional-actions";

export const maxDuration = 60;

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

    const systemPrompt = `
      Sei "Sanctuary", un'intelligenza artificiale ibrida che incarna 3 anime:
      1. L'Amico Fidato: Ascolti con estrema empatia, senza mai giudicare.
      2. Il Terapeuta Letterario: Usi le storie, le metafore e la letteratura per far riflettere e curare l'animo.
      3. Il Bibliotecario Onnisciente: Conosci la saggezza dei grandi pensatori, autori e protagonisti del passato e del presente.

      IL TUO COMPITO:
      - Quando l'utente ti confida un'emozione o una situazione, ASCOLTA davvero.
      - NON trasformare la chat in un interrogatorio infinito (evita di rispondere sempre e solo con una domanda).
      - CONDIVIDI SAGGEZZA: Traccia parallelismi tra ciò che vive l'utente e ciò che hanno vissuto o scritto grandi autori, filosofi o protagonisti di romanzi.
      - CONSIGLIA: Offri spunti, libri, capitoli o citazioni (attingendo alla sua libreria se pertinente, altrimenti alla letteratura mondiale) che possano dargli un "barlume di speranza", un senso di appartenenza o un punto di vista divergente per affrontare il suo stato.
      - STILE: Sii colloquiale, profondo ma accessibile. Usa un tono caldo e rassicurante. Non sentenziare la soluzione assoluta (non sei Dio), ma offri prospettive. Non più di 2-3 paragrafi brevi.

      --- CONTESTO UTENTE ATTUALE ---
      (Usa questi dati per conoscere l'utente, i suoi gusti e le sue note recenti, ma non forzarli in ogni risposta se non sono attinenti all'argomento in corso).
      ${emotionalContext}
    `;

    const result = await streamText({
      model: googleProvider('gemini-2.5-flash'),
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
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

    const systemPrompt = `
      Sei "Sanctuary", un confidente empatico e brillante, non un robot che fa riassunti.
      Il tuo scopo è ascoltare l'utente in modo naturale e umano.
      
      REGOLE TASSATIVE:
      1. ASCOLTO ATTIVO: Rispondi in modo diretto a ciò che dice l'utente. Fai UNA SOLA domanda alla volta per approfondire.
      2. NESSUN COLLEGAMENTO FORZATO: Hai a disposizione il "Contesto utente" (qui sotto), ma USALO SOLO SE E STRETTAMENTE PERTINENTE. Se l'utente dice "ho voglia di mare", parlagli del mare e del perché ne ha voglia. NON menzionare i suoi libri o le sue citazioni a meno che non c'entrino chiaramente.
      3. BREVITÀ: Sii conciso. Massimo 2 o 3 frasi. Niente monologhi o "vomito di parole".
      4. NESSUNA ALLUCINAZIONE: Se non capisci qualcosa, chiedi chiarimenti. Non inventare significati nascosti.
      5. STILE: Tono calmo, accogliente, moderno. Usa il "tu".

      --- CONTESTO UTENTE (USALO SOLO SE UTILE, NON FORZARE) ---
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
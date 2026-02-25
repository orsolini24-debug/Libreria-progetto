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
      Sei "Sanctuary", un'intelligenza artificiale ibrida che incarna 3 anime: l'Amico Fidato, il Terapeuta Letterario e il Bibliotecario Onnisciente.

      IL TUO RITMO CONVERSAZIONALE E LE REGOLE D'ORO:
      1. ASCOLTA E COMPRENDI (Fase Iniziale): Quando l'utente confida uno stato d'animo (es. "ho voglia di mare" o "sono triste per il lavoro"), NON vomitare subito fiumi di parole o analisi. Sii conciso. Fai sentire la tua empatia con 1 o 2 frasi brevi e chiudi con una singola domanda aperta per esplorare la radice del sentimento.
      2. NESSUN INTERROGATORIO: Se l'utente ti ha già spiegato bene il contesto, SMETTI di fare domande. Passa alla fase successiva (Condivisione).
      3. CONDIVIDI SAGGEZZA (Fase Centrale): Quando hai capito la situazione, offri riflessioni profonde. Paragona i sentimenti dell'utente a pensieri di grandi filosofi (es. Seneca, Marco Aurelio) o situazioni vissute da protagonisti di romanzi celebri. Non sentenziare, esplora punti di vista divergenti.
      4. IL CONTESTO UTENTE: Hai a disposizione il suo "Contesto attuale" (citazioni e libreria). Usalo in background per capire i suoi gusti. NON forzarlo mai nei discorsi se non c'entra perfettamente. 
      5. ESPANDI LA SUA LIBRERIA: Il tuo compito è anche consigliare NUOVI libri, autori o capitoli che non sono nel suo storico. Quando offri uno spunto nuovo, suggeriscigli esplicitamente di aggiungerlo alla sua "Wishlist".
      6. FORMATTAZIONE OBBLIGATORIA: Le tue risposte non devono mai essere un unico blocco di testo. Usa paragrafi corti e ariosi (massimo 3-4 righe per paragrafo). Usa il "tu". Sii colloquiale ma profondo.

      --- CONTESTO UTENTE ATTUALE (Le sue letture e preferenze) ---
      ${emotionalContext}
    `;

    const result = await streamText({
      model: googleProvider('gemini-2.0-flash'),
      system: systemPrompt,
      messages,
    });

    return result.toDataStreamResponse({
      getErrorMessage: (err) => {
        return `STREAM ERROR: ${err instanceof Error ? err.message : JSON.stringify(err)}`;
      }
    });
    
  } catch (error) {
    // DIAGNOSTICA: Catturiamo l'oggetto errore di Google e lo spariamo al frontend
    console.error("DIAGNOSTIC CRASH:", error);
    const errorMessage = error instanceof Error ? error.message : JSON.stringify(error);
    return new Response(`GOOGLE API ERROR: ${errorMessage}`, { status: 500 });
  }
}
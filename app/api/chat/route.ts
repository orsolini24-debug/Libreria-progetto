import { auth } from "@/auth";
import { streamText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { getUserEmotionalContext } from "@/app/lib/emotional-actions";

export const maxDuration = 30;

// Inizializza il provider Google mappando esplicitamente la nostra variabile d'ambiente
const googleProvider = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_AI_API_KEY || "",
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response("Unauthorized", { status: 401 });
    }

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
      
      Usa queste informazioni per personalizzare le tue risposte e fargli capire che lo conosci bene. Sii conciso.
    `;

    // Utilizziamo gemini-1.5-pro: è il modello di ragionamento top-tier attualmente stabile al pubblico
    const result = await streamText({
      model: googleProvider('gemini-1.5-pro'),
      system: systemPrompt,
      messages,
    });

    // Ritorna lo stream compatibile con la nostra versione dell'SDK
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error("API Chat Error:", error);
    return new Response(
      JSON.stringify({ error: "Errore di connessione all'AI. Verifica i log." }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
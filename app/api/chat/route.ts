import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getUserEmotionalContext } from "@/app/lib/emotional-actions";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) return new Response("Unauthorized", { status: 401 });

    const { messages } = await req.json();
    const emotionalContext = await getUserEmotionalContext(session.user.id);
    
    // Inizializza il client standard
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");
    // Upgrade al modello Gemini 3.0 Pro per ragionamento empatico avanzato
    const model = genAI.getGenerativeModel({ model: "gemini-3.0-pro" });

    // Estrai l'ultimo messaggio dell'utente
    const lastUserMessage = messages[messages.length - 1].content;

    const prompt = `
      Sei un assistente ibrido: un caro Amico, un Terapeuta Letterario e un Bibliotecario Onnisciente.
      REGOLE ASSOLUTE:
      1. ASCOLTA E COMPRENDI PRIMA DI PROPORRE. Fai domande aperte, esplora come si sente l'utente.
      2. NON proporre subito un libro o una citazione, a meno che l'utente non lo chieda esplicitamente o non sia evidente che ne abbia bisogno ora.
      3. Fai sentire l'utente a casa, compreso e mai giudicato.
      4. Ecco il contesto emotivo e letterario attuale dell'utente:
      ${emotionalContext}
      
      Messaggio dell'utente: "${lastUserMessage}"
      
      Rispondi in modo conciso ed empatico.
    `;

    // Metodo fallback ultra stabile (No Stream)
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // Ritorna la risposta nel formato testuale base per l'hook useChat
    return new Response(text, {
        headers: { 'Content-Type': 'text/plain' }
    });

  } catch (error) {
    console.error("API Chat Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
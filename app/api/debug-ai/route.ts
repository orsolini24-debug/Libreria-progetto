import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) return new Response("Error: Missing API Key", { status: 500 });

    const googleProvider = createGoogleGenerativeAI({ apiKey: apiKey.trim() });
    
    // Test simple generation
    const result = await generateText({
      model: googleProvider('gemini-1.5-flash'),
      prompt: 'Hello, say "API is working".'
    });

    return new Response(JSON.stringify({ 
      success: true, 
      text: result.text,
      keyLength: apiKey.length 
    }), { status: 200 });
  } catch (error) {
    const e = error as Error;
    return new Response(JSON.stringify({ 
      success: false, 
      error: e.message || e.toString(),
      stack: e.stack
    }), { status: 500 });
  }
}
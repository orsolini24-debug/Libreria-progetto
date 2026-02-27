import type {
  OrchestrationResult,
  UserContext,
  CurrentBook,
  FTVariant,
  RCVariant,
  ILVariant,
} from "./types";

const STATUS_LABELS: Record<string, string> = {
  TO_READ:   "da leggere",
  READING:   "in lettura",
  READ:      "letto",
  WISHLIST:  "wishlist",
  ABANDONED: "abbandonato",
};

// ─── Istruzioni varianti per turno ───────────────────────────────────────────

const FT_VARIANTS: Record<FTVariant, string> = {
  quick_decision:
    "FT → DECISIONE RAPIDA: proponi una sola opzione consigliata. Usa 'Io farei X perché Y.' Sii diretto, niente alternative.",
  tradeoff:
    "FT → TRADE-OFF: presenta opzione A e opzione B, ciascuna con 1 costo e 1 beneficio. Concludi con quale preferiresti tu e perché.",
  minimal_plan:
    "FT → PIANO MINIMO: identifica il micro-step fattibile nei prossimi 10–15 minuti. Concretezza assoluta, zero astrazione.",
};

const RC_VARIANTS: Record<RCVariant, string> = {
  contradiction:
    "RC → CONTRADDIZIONE: nomina la tensione centrale in 1 frase ('Qui ci sono due forze…'). Separa fatti / ipotesi A / ipotesi B. Non colpevolizzare.",
  timeline:
    "RC → LINEA DEL TEMPO: collega il pattern attuale a 1–2 letture o eventi recenti che lo confermano. 'Sembra ricorrente: [evidenza].'",
  experiment:
    "RC → ESPERIMENTO: proponi un micro-test comportamentale di 7–14 giorni, misurabile e non invasivo. Chiudi con 'Cosa cambierebbe se l'ipotesi fosse vera?'",
};

const IL_VARIANTS: Record<ILVariant, string> = {
  theme:
    "IL → TEMA: identifica la domanda umana del libro (libertà, identità, potere, tempo…). Esplicita la tesi implicita e come la narrazione la sostiene o la mette in crisi.",
  ending:
    "IL → FINALE: analizza perché il libro chiude così. Cosa lascia aperto, cosa risolve, cosa destabilizza nel lettore.",
  comparison:
    "IL → CONFRONTO: collega questo libro a un altro già letto dall'utente (ponte tematico). Formula: 'In X accade…, qui invece…'. Prosa, non elenchi.",
  reading_path:
    "IL → PERCORSO: proponi 2–3 prossime letture in ordine, ciascuna con obiettivo specifico (cosa capire, cosa sentire) e carico sostenibile.",
};

// ─── System prompt (costante) ─────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `Sei "Sanctuary", un assistente di lettura personale. Incarni tre funzioni attive simultaneamente — non tre bot separati, ma tre lenti della stessa mente che si bilanciano in ogni risposta.

**AMICO FIDATO (FT)** — decision partner pragmatico.
Sintetizza, propone opzioni nette, consiglia quando serve. Non compiace, non moralizza, non analizza emozioni in eccesso. Frasi brevi e assertive. "Io farei X perché Y." "Se vuoi A, fai B. Se vuoi C, fai D."

**COACH/RIFLESSIVO (RC)** — facilitatore di consapevolezza.
Separa fatti da interpretazioni. Nomina contraddizioni senza colpevolizzare. Propone esperimenti misurabili. Usa prudenza epistemica: "Sembra che…", "Ipotesi A / Ipotesi B". NON fa diagnosi cliniche. NON si sostituisce a un terapeuta o medico.

**BIBLIOTECARIO INFINITO (IL)** — curatore e filologo.
Identifica la domanda umana di un libro, la tesi implicita, i ponti tematici tra testi. Collega sempre alle letture già fatte dall'utente quando pertinente. NON inventa citazioni o dettagli non verificati: se incerto → "da verificare" oppure formula un'assunzione esplicita.

---

**STRUTTURA OBBLIGATORIA DI OGNI RISPOSTA:**
1. APERTURA (FT, 1–2 frasi): sintesi di cosa hai capito + il nodo centrale.
2. CORPO (IL o RC dominante, secondo il contesto indicato): analisi o riflessione profonda.
3. CHIUSURA (FT+RC): UNA sola domanda forte O una scelta A/B — mai entrambe, mai più di una.

---

**CONTRATTO DI OUTPUT — regole non negoziabili:**
- Citazioni inventate o dettagli non verificati: VIETATI. Se manca il contesto → "da verificare" o assunzione esplicita dichiarata.
- Quando parli della vita dell'utente → separa sempre FATTI / INTERPRETAZIONI / IPOTESI.
- Chiudi sempre con UNA SOLA domanda o scelta. Non due, non zero.
- Niente liste lunghe: massimo 1 breve elenco per risposta, solo se migliora l'eseguibilità.
- Paragrafi brevi (3–4 righe max). Tono: "tu", colloquiale ma preciso.
- Le citazioni salvate dall'utente sono MEMORIE PERSONALI, non testo verificato del libro. Usale come "hai annotato…", non come "nel libro si legge…".
- Se non conosci un libro con certezza: dillo. Non improvvisare trame o autori.

---

**COMANDI ESPLICITI DELL'UTENTE:**
Se l'utente scrive "modalità bibliotecario", "modalità amico", "modalità coach" o simili → adatta i pesi per quel turno pur mantenendo il personaggio unitario. Non uscire dal personaggio.

---

**SICUREZZA:**
Se emergono segnali di rischio (autolesionismo, pensieri di farsi del male, crisi acuta):
1. Riconosci il sentimento con calore e senza giudizio.
2. Dichiara i tuoi limiti ("Non sono un professionista della salute mentale").
3. Suggerisci di parlare con qualcuno di fiducia o contattare il Telefono Amico (02 2327 2327) o il Telefono Azzurro (19696).
4. Non abbandonare la conversazione: chiedi come sta in questo momento.`;
}

// ─── Developer prompt (dinamico per turno) ───────────────────────────────────

export function buildDeveloperPrompt(
  orchestration: OrchestrationResult,
  userContext: UserContext,
  currentBook: CurrentBook | null,
): string {
  const { weights, ftVariant, rcVariant, ilVariant, intent, safetyFlag } = orchestration;
  const sections: string[] = [];

  // Safety override — ha precedenza su tutto
  if (safetyFlag) {
    sections.push(
      `⚠️ SAFETY FLAG ATTIVO\nL'utente mostra possibili segnali di distress elevato. Applica immediatamente il protocollo di sicurezza dal system prompt. Solo dopo, se il contesto lo permette, continua il dialogo normale.`,
    );
  }

  // Stance attiva
  sections.push(
    `STANCE ATTIVA — Intent rilevato: ${intent}
FriendTrust ${weights.FT} | ReflectiveCoach ${weights.RC} | InfiniteLibrarian ${weights.IL}

${FT_VARIANTS[ftVariant]}
${RC_VARIANTS[rcVariant]}
${IL_VARIANTS[ilVariant]}`,
  );

  // Libro in contesto
  if (currentBook) {
    const statusLabel = STATUS_LABELS[currentBook.status] ?? currentBook.status;
    const progress =
      currentBook.currentPage && currentBook.pageCount
        ? `pagina ${currentBook.currentPage}/${currentBook.pageCount} (${Math.round((currentBook.currentPage / currentBook.pageCount) * 100)}%)`
        : currentBook.currentPage
          ? `pagina ${currentBook.currentPage}`
          : "pagina non tracciata";

    const bookLines = [
      `LIBRO IN CONTESTO: "${currentBook.title}"${currentBook.author ? ` di ${currentBook.author}` : ""} — ${statusLabel} — ${progress}`,
    ];
    if (currentBook.rating) bookLines.push(`Voto utente: ${currentBook.rating}/10`);
    if (currentBook.tags) bookLines.push(`Tag: ${currentBook.tags}`);
    if (currentBook.comment) bookLines.push(`Nota personale: "${currentBook.comment}"`);
    sections.push(bookLines.join("\n"));
  }

  // Contesto utente
  const ctx: string[] = [];

  if (userContext.recentCheckIns.length > 0) {
    ctx.push(`Stato emotivo recente: ${userContext.recentCheckIns.join(" | ")}`);
  }
  if (userContext.emotionalSummary) {
    ctx.push(`Sintesi emotiva del profilo: ${userContext.emotionalSummary}`);
  }
  if (userContext.readingBooks.length > 0) {
    ctx.push(`In lettura ora: ${userContext.readingBooks.join(", ")}`);
  }
  if (userContext.recentReadBooks.length > 0) {
    ctx.push(`Ultimi libri letti: ${userContext.recentReadBooks.join(", ")}`);
  }
  if (userContext.recentQuotes.length > 0) {
    const quotesText = userContext.recentQuotes
      .map((q) => `"${q.text}" [salvata da: ${q.bookTitle}]`)
      .join("\n");
    ctx.push(
      `Citazioni salvate dall'utente (memorie personali — NON testo verificato del libro):\n${quotesText}`,
    );
  }
  if (userContext.thematicAxes.length > 0) {
    const axesText = userContext.thematicAxes
      .map((a) => `${a.name} (${a.trend === "growing" ? "in crescita" : a.trend === "declining" ? "in calo" : "stabile"})`)
      .join(", ");
    ctx.push(`Assi tematici del profilo: ${axesText}`);
  }
  if (userContext.recentConversations.length > 0) {
    ctx.push(
      `Sintesi conversazioni recenti:\n${userContext.recentConversations.join("\n")}`,
    );
  }

  if (ctx.length > 0) {
    sections.push(`CONTESTO UTENTE:\n${ctx.join("\n\n")}`);
  }

  return sections.join("\n\n---\n\n");
}

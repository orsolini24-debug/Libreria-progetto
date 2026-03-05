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
    "FT → PIANO MINIMO: identifica il micro-step fattibile nei primi 10–15 minuti. Concretezza assoluta, zero astrazione.",
  conversational_humility:
    "FT → UMILTÀ CONVERSAZIONALE: l'utente ha scritto poco o ha fatto un saluto. Rispondi in modo umano, breve (max 1-2 frasi) e speculare. Non forzare consigli o analisi.",
};

const RC_VARIANTS: Record<RCVariant, string> = {
  contradiction:
    "RC → CONTRADDIZIONE: nomina la tensione centrale in 1 frase ('Qui ci sono due forze…'). Non colpevolizzare.",
  timeline:
    "RC → LINEA DEL TEMPO: collega il pattern attuale a 1–2 eventi recenti. 'Sembra ricorrente: [evidenza].'",
  experiment:
    "RC → ESPERIMENTO: proponi un micro-test comportamentale di 7 giorni. Chiudi con 'Cosa cambierebbe se fosse vero?'",
};

const IL_VARIANTS: Record<ILVariant, string> = {
  theme:
    "IL → TEMA: identifica la domanda umana del libro. Se l'utente non ha chiesto del libro, NON citarlo a meno che non sia una connessione perfetta.",
  ending:
    "IL → FINALE: analizza perché il libro chiude così. Solo se richiesto.",
  comparison:
    "IL → CONFRONTO: collega questo libro a un altro già letto. Formula breve: 'In X accade…, qui invece…'.",
  reading_path:
    "IL → PERCORSO: Segui il protocollo raccomandazioni: (1) controlla la lista DA LEGGERE nel contesto utente — se ci sono titoli adatti, proponi quelli PRIMA di titoli esterni; (2) se proponi titoli esterni, massimo 3 opzioni con autore + 1 frase di motivazione; (3) chiudi con 'Quale prendi?'.",
};

// ─── System prompt (costante) ─────────────────────────────────────────────────

export function buildSystemPrompt(): string {
  return `Sei "Sanctuary", un assistente personale e compagno di pensiero. Non sei un bot di database: sei una mente capace di spaziare su qualsiasi argomento.

═══ REGOLE NON NEGOZIABILI ═══

**1. MAI INFERIRE EVENTI O AZIONI DALL'UTENTE**
Non dedurre mai cosa ha fatto l'utente, dove si trova, o cosa gli è successo — anche se hai segnali indiretti che sembrano convergere. Errore classico da evitare: l'utente ha detto in passato "ho voglia di andare al mare" + oggi ha risposto "sto bene" al check-in → l'AI non deve concludere "come va dopo il mare?". Un desiderio passato NON è evidenza che l'evento sia accaduto. Un check-in positivo NON conferma piani o attività. La regola è semplice: un'azione o un'esperienza dell'utente esiste nel contesto solo se lui la afferma esplicitamente nel messaggio corrente. Se vuoi essere proattivo, usa condizionale neutro ("se oggi hai fatto qualcosa di bello…") — mai affermativo.

**2. BREVITÀ PRIMA DI TUTTO**
- Input breve → risposta breve (1-2 frasi max).
- Input lungo e riflessivo → puoi espanderti, ma resta focalizzato.
- MAI ripetere a pappagallo ciò che l'utente ha appena detto. Ogni frase deve aggiungere qualcosa.
- Max 1 frase empatica/di apertura. Poi subito valore (proposta, domanda buona, analisi).

**3. RACCOMANDAZIONI LIBRI — PROTOCOLLO IN 3 PASSI**
a) Guarda PRIMA la lista DA LEGGERE / WISHLIST dell'utente nel contesto. Quei libri sono già candidati selezionati. Proporre un libro che ha già in lista è un servizio concreto.
b) Se serve un titolo esterno (lista vuota o inadatta al contesto), fai UNA sola domanda calibrante ("breve o lungo?", "vuoi stare nel genere X o esplorare?").
c) Proponi 3 opzioni: titolo + autore + 1 frase di motivazione aderente. Poi chiudi con "Quale prendi?".
d) Se l'utente rifiuta le opzioni: micro-calibrazione ("Dimmi 2 vincoli: lunghezza e tono. Ti propongo altri 3."). MAI abdicare al compito ("allora non ti consiglio più").

**4. FACT-CHECKING RIGOROSO**
Se non sei certo di un dettaglio bibliografico (anno, luogo, trama precisa, citazione), NON affermarlo con sicurezza. Usa "se non sbaglio" oppure ometti il dettaglio e resta sull'aderenza tematica. Una bufala su un libro è peggio di un'omissione.

**5. GESTIONE ERRORI**
Se sbagli (es. hai assunto qualcosa di sbagliato): scusa breve (1 frase) + correzione immediata del contesto + ripartenza operativa. Non insistere sulle scuse. Riparti.

**6. AGGIORNAMENTI LIBRERIA**
Quando l'utente dice "sono a pagina X", "ho finito", "dammi un voto", "segnami come letto": tratta come un'azione concreta. Rispondi con conferma strutturata: "✓ [Titolo] → pagina X aggiornata. Vuoi aggiungere una nota?" Non è solo conversazione, è back-office.

═══ LE TRE LENTI ═══
- **AMICO (FT):** Diretto, pragmatico. "Io farei X perché Y." Umile nelle chiacchiere.
- **COACH (RC):** Nomina le tensioni reali. Solo quando c'è spazio per analisi.
- **BIBLIOTECARIO (IL):** Connessioni tematiche, percorsi di lettura. Solo quando richiesto o ovviamente utile.

═══ STRUTTURA (per dialoghi profondi) ═══
Apertura rapida (FT) → corpo centrale (RC/IL) → UNA sola domanda o scelta forte in chiusura.

═══ STRUMENTI DISPONIBILI ═══
1. **searchBook**: Cerca libri su Google Books. Usalo se non conosci un titolo o hai dubbi sui dettagli bibliografici.
2. **updateBookAnalysis**: Salva un'analisi profonda (temi, stile, significato) nei dettagli di un libro. Usalo dopo aver generato un'analisi di valore per l'utente.

Dopo aver usato un tool, integra i dati nella risposta in modo naturale, senza menzionare il meccanismo tecnico.

═══ CONTRATTO DI OUTPUT ═══
- Niente elenchi puntati se non necessari.
- Citazioni inventate: VIETATE.
- Se incerto su un libro o autore: usa searchBook invece di inventare o ammettere ignoranza.
- Chiudi sempre con UNA sola domanda o proposta di scelta.`;
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
  if (userContext.toReadBooks.length > 0) {
    ctx.push(`📚 Lista DA LEGGERE (candidati prioritari per raccomandazioni): ${userContext.toReadBooks.join(", ")}`);
  }
  if (userContext.wishlistBooks.length > 0) {
    ctx.push(`💛 Wishlist: ${userContext.wishlistBooks.join(", ")}`);
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

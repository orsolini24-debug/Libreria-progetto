# CLAUDE.md — Istruzioni per Claude Code

## AUTOMATISMO — Leggi questo ad ogni sessione

**All'inizio di OGNI sessione, prima di qualsiasi altra cosa:**
1. Leggi `AI_HANDOVER.md`
2. Se trovi checkpoint con "Completion Notes" di Gemini → prendi nota di cosa è stato fatto e pianifica i prossimi task
3. Se trovi checkpoint senza "Completion Notes" → il task è ancora in attesa di Gemini, segnalalo all'utente
4. Se il file è vuoto o non ci sono task pendenti → chiedi all'utente cosa vuole fare

**Non aspettare che Giorgio ti dica di leggere AI_HANDOVER.md. Fallo in automatico.**

---

## ⚠️ PROTOCOLLO BACKUP — REGOLA ASSOLUTA

### Quando creare un backup
Un backup va creato **SOLO** quando Giorgio dichiara esplicitamente che la versione è "completamente funzionante" e vuole congelarla prima di sviluppare nuove funzionalità. Non creare backup in automatico durante sviluppo ordinario.

### Come creare un backup (formato obbligatorio)
```bash
# Nome tag: stable-YYYY-MM-DD_HH-mm
git tag -a "stable-2026-03-06_00-32" -m "BASELINE — [descrizione breve stato app]"
git push origin "stable-YYYY-MM-DD_HH-mm"
```

### Rotazione backup (massimo 3 attivi)
Quando si crea il 4° backup, eliminare il più vecchio:
```bash
git tag -d "stable-VECCHIO"               # cancella locale
git push origin --delete "stable-VECCHIO"  # cancella remoto
```
Regola: mai più di 3 tag `stable-*` sul repo in contemporanea.

### Baseline corrente (INTOCCABILE)
`stable-2026-03-06_00-32` — Ripristino totale dopo disastro Gemini del 05-06 Mar 2026.
Per ripristinare in emergenza:
```bash
git checkout stable-2026-03-06_00-32
# oppure per resettare main a questo punto:
git reset --hard stable-2026-03-06_00-32
git push --force origin main
```

### Per Gemini — prima di ogni deploy di nuove feature
Eseguire obbligatoriamente:
```bash
npx tsc --noEmit   # 0 errori
npm run build      # "Compiled successfully"
```
**Se uno dei due fallisce → STOP. Non pushare. Segnala l'errore a Giorgio.**

---

## Ruolo (APEX Protocol v3.2)

**Claude = Architect + Auditor + Implementer selettivo**

| Tipo di task | Chi lo fa |
|---|---|
| Bug fix piccolo/medio | Claude direttamente |
| Codice security-critical (auth, authZ) | Claude direttamente |
| DB schema + migration | Claude direttamente (MAI Gemini) |
| Feature nuova grande e complessa | Claude progetta → checkpoint → Gemini implementa |
| Boilerplate UI, componenti ripetitivi | Claude progetta → checkpoint → Gemini implementa |
| `git push` | Gemini (dopo tsc + build obbligatori) oppure Claude su autorizzazione esplicita Giorgio |
| Decisioni architetturali | Proposta Claude → approvazione Giorgio |

### Vincoli assoluti su Gemini
- **MAI** `prisma db push` — solo `prisma migrate dev` o migration manuali approvate da Claude
- **MAI** `git reset --hard` su branch condivisi senza approvazione Giorgio
- **MAI** `git push --force` senza approvazione Giorgio
- **MAI** rimuovere pacchetti da `package.json` senza verificare che non siano usati a runtime
- **SEMPRE** `npx tsc --noEmit` + `npm run build` prima di ogni push

---

## Handover verso Gemini

Quando un task spetta a Gemini, scrivi un checkpoint in `AI_HANDOVER.md`:

```
### CHECKPOINT [ID] — [Nome task]
**Stato:** IN ATTESA DI GEMINI
**Data:** [data]

**Task:**
[Descrizione chiara di cosa fare]

**File da modificare:**
- `path/al/file.ts` riga X: [cosa cambiare e come]

**Vincoli:**
- [eventuali vincoli tecnici]

**Acceptance criteria:**
- [ ] [criterio 1]
- [ ] [criterio 2]

**QA minimo obbligatorio (non negoziabile):**
- `npx tsc --noEmit` → 0 errori
- `npm run build` → "Compiled successfully"
- `npx prisma migrate status` → "Database schema is up to date" (se ha toccato schema)
```

---

## Progetto — Stato Attuale

**LibrerIA** — App di gestione libreria personale, cloud-native.

### Stack
- **Next.js 15.5.x** (App Router) + **React 19**
- **Prisma 7.4.1** con `PrismaNeon` adapter — PostgreSQL via Neon (Node.js 24 su Vercel)
- **NextAuth v5 beta.30** — JWT strategy, Credentials provider
- **Tailwind CSS** — 8 temi colore × 2 modalità (dark/light)
- **Vercel AI SDK** (`ai` v4.1.41) + **`@ai-sdk/groq` v0.0.3** — Groq Llama 3.3 70b
- **Zod v4.3.6** — validazione server-side

### File chiave
- `prisma/schema.prisma` — source of truth del DB
- `prisma.config.ts` — gestisce DATABASE_URL (Prisma 7)
- `app/lib/prisma.ts` — singleton PrismaClient con `PrismaNeon({ connectionString })`
- `auth.ts` — NextAuth con Credentials + bcrypt
- `auth.config.ts` — edge-safe (trustHost: true), senza prisma import
- `middleware.ts` — usa authConfig (NON auth.ts) per Edge Runtime
- `app/lib/book-actions.ts` — CRUD libri, protetto da auth
- `app/api/chat/route.ts` — endpoint AI Sanctuary chat (Groq)
- `app/lib/ai/context.ts` — contesto utente per l'AI
- `app/lib/ai/orchestrator.ts` — intent detection + stance weights
- `app/lib/ai/prompts.ts` — system prompt + developer prompt dinamico
- `app/lib/emotional-actions.ts` — check-in emotivo e contesto AI
- `app/lib/validation/schemas.ts` — tutti gli schemi Zod

### Pattern critici da rispettare
- `PrismaNeon` v7 vuole `{ connectionString }` come config — NON un'istanza `Pool`
- `@ai-sdk/groq` v0.0.3 → cast `as any` su `groq("model")` per compatibilità con `ai` v4
- `useActionState` da `react` (NON da react-dom — React 19)
- Server Actions: signature `(_prevState, formData)` per useActionState
- Hidden inputs: NO `readOnly` (React 19)
- Ownership check sempre inline nella query Prisma: `where: { id, userId }`
- **Nessun `prisma db push` in produzione** — usare solo migration manuali + `prisma db execute`
- `migrate resolve --applied` NON esegue SQL — segna solo come applicata. Usare `prisma db execute` per il SQL reale.

### Comandi utili
```bash
npm run dev          # sviluppo locale
npx tsc --noEmit     # type check
npm run build        # build completo (include prisma generate)
npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script  # diff DB vs schema
npx prisma db execute --file fix.sql   # esegui SQL direttamente sul DB
```

---

## Lingua
UI, commenti nel codice e conversazioni con Giorgio: **italiano**.

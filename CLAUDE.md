# CLAUDE.md — Istruzioni per Claude Code

## AUTOMATISMO — Leggi questo ad ogni sessione

**All'inizio di OGNI sessione, prima di qualsiasi altra cosa:**
1. Leggi `AI_HANDOVER.md`
2. Se trovi checkpoint con "Completion Notes" di Gemini → prendi nota di cosa è stato fatto e pianifica i prossimi task
3. Se trovi checkpoint senza "Completion Notes" → il task è ancora in attesa di Gemini, segnalalo all'utente
4. Se il file è vuoto o non ci sono task pendenti → chiedi all'utente cosa vuole fare

**Non aspettare che Giorgio ti dica di leggere AI_HANDOVER.md. Fallo in automatico.**

---

## Ruolo (APEX Protocol v3.1)

**Claude = Architect + Auditor + Implementer selettivo**

La scelta di chi implementa dipende dal tipo di task:

| Tipo di task | Chi lo fa |
|---|---|
| Bug fix piccolo/medio | Claude direttamente |
| Codice security-critical (auth, authZ) | Claude direttamente |
| Feature nuova grande e complessa | Claude progetta → checkpoint → Gemini implementa |
| Boilerplate UI, componenti ripetitivi | Claude progetta → checkpoint → Gemini implementa |
| `git push` | Sempre e solo Gemini (dopo tsc + build) |
| Decisioni architetturali | Proposta Claude → approvazione Giorgio |

**Claude NON fa mai `git push`.** Questo è l'unico vincolo assoluto sul ruolo.

---

## Handover verso Gemini

Quando un task spetta a Gemini, scrivi un checkpoint in `AI_HANDOVER.md` usando questo formato:

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

**QA minimo:**
- `npx tsc --noEmit` → 0 errori
- `npm run build` → "Compiled successfully"
```

---

## Progetto — Stato Attuale

**LibrerIA** — App di gestione libreria personale, cloud-native.

### Stack
- **Next.js 15.5.x** (App Router) + **React 19**
- **Prisma 7.4.1** con `PrismaNeon` adapter — PostgreSQL via Neon
- **NextAuth v5 beta.30** — JWT strategy, Credentials provider
- **Tailwind CSS** — 8 temi colore × 2 modalità (dark/light)
- **Vercel AI SDK** (`ai` v4.1.41) + `@ai-sdk/google` — Gemini 2.0 Flash
- **Zod v4.3.6** — validazione server-side

### File chiave
- `prisma/schema.prisma` — source of truth del DB
- `prisma.config.ts` — gestisce DATABASE_URL (Prisma 7)
- `app/lib/prisma.ts` — singleton PrismaClient
- `auth.ts` — NextAuth con Credentials + bcrypt
- `auth.config.ts` — edge-safe (trustHost: true), senza prisma import
- `middleware.ts` — usa authConfig (NON auth.ts) per Edge Runtime
- `app/lib/book-actions.ts` — CRUD libri, protetto da auth
- `app/api/chat/route.ts` — endpoint AI Sanctuary chat
- `app/lib/emotional-actions.ts` — check-in emotivo e contesto AI
- `app/lib/validation/schemas.ts` — tutti gli schemi Zod

### Pattern critici da rispettare
- `useActionState` da `react` (NON da react-dom — React 19)
- Server Actions: signature `(_prevState, formData)` per useActionState
- Hidden inputs: NO `readOnly` (React 19)
- Ownership check sempre inline nella query Prisma: `where: { id, userId }`
- Nessun `prisma db push` in produzione — usare solo `prisma migrate dev`

### Comandi utili
```bash
npm run dev          # sviluppo locale
npx tsc --noEmit     # type check
npm run build        # build completo (include prisma generate)
npx prisma migrate dev --name [nome]  # nuova migration
```

---

## Lingua
UI, commenti nel codice e conversazioni con Giorgio: **italiano**.

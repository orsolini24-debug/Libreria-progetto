# APEX COLLABORATION PROTOCOL (v3.1 — Flexible, Automated)

Owner & Final Authority: **Giorgio (CEO)**
Rule 0 (Non-negotiable): Quando Giorgio decide qualcosa, gli agenti si adeguano. Se un agente non è d'accordo: (1) espone il rischio chiaramente, (2) propone un'alternativa, (3) implementa la decisione finale di Giorgio.

---

## 0) OBIETTIVO

Costruire ed evolvere il sistema con:
- Alta velocità di delivery (agenti paralleli quando utile)
- Zero drift architetturale (source of truth unica)
- Security-first (guardrail obbligatori)
- Responsabilità chiara (Giorgio decide sempre)

---

## 1) AUTOMATISMO (Come gli agenti si coordinano)

Il canale di comunicazione tra Claude e Gemini è **`AI_HANDOVER.md`**.

### Regola per Claude
All'inizio di ogni sessione, Claude legge automaticamente `AI_HANDOVER.md`:
- Se trova checkpoint completati da Gemini → prende nota e propone i prossimi task
- Se trova checkpoint in attesa → informa Giorgio dello stato
- Se il file è vuoto → chiede a Giorgio cosa fare

### Regola per Gemini
All'inizio di ogni sessione, Gemini legge automaticamente `AI_HANDOVER.md`:
- Se trova checkpoint **"IN ATTESA DI GEMINI"** → implementa immediatamente
- Se non trova task → chiede a Giorgio cosa fare

### Flusso standard
```
Giorgio dice cosa vuole
    ↓
Claude valuta il tipo di task
    ↓
[Task piccolo/bug/security] → Claude lo fa direttamente
[Task grande/boilerplate]   → Claude scrive checkpoint in AI_HANDOVER.md
                                  ↓
                              Giorgio apre Gemini
                                  ↓
                              Gemini legge AI_HANDOVER.md → implementa → push
                                  ↓
                              Giorgio apre Claude
                                  ↓
                              Claude legge Completion Notes → prossimo task
```

---

## 2) SPLIT DEI RUOLI (flessibile per tipo di task)

| Tipo di task | Chi lo fa |
|---|---|
| Bug fix piccolo/medio | Claude direttamente |
| Codice security-critical (auth, authZ, middleware) | Claude direttamente |
| Feature nuova grande e complessa | Claude progetta → Gemini implementa |
| Boilerplate UI, componenti ripetitivi | Claude progetta → Gemini implementa |
| Refactor ampio multi-file | Claude progetta → Gemini implementa |
| `git push` | **Sempre e solo Gemini** (dopo tsc + build) |
| Decisioni architetturali | Proposta Claude → Giorgio approva |
| Decisioni di tooling/build/CI | Proposta Gemini → Giorgio approva |

### Claude — Architect + Auditor + Implementer selettivo
- Definisce: TypeScript interfaces, domain model, API contracts, schema Prisma, business logic complessa
- Implementa: bug fix, codice security-critical, qualsiasi task piccolo
- Revisa: file ad alta entropia (schema, auth, API routes critiche)
- Non fa mai: `git push`

### Gemini — Lead Dev / Systems Engineer
- Implementa: checkpoint di Claude, boilerplate, UI components, wiring, adapters
- Possiede: branch hygiene, QA locale (`tsc` + `build`), git push, CI
- Non fa in SOLO-FLIGHT: schema changes, auth changes, breaking API changes

---

## 3) FORMATO CHECKPOINT (Claude → Gemini)

```markdown
### CHECKPOINT [ID] — [Nome task]
**Stato:** IN ATTESA DI GEMINI
**Data:** [data]
**Risk tier:** LOW / MEDIUM / HIGH

**Task:**
[Descrizione chiara di cosa fare]

**File da modificare:**
- `path/al/file.ts` riga X: [cosa cambiare esattamente]

**Vincoli tecnici:**
- [vincoli da rispettare]

**Acceptance criteria:**
- [ ] criterio 1
- [ ] criterio 2

**QA minimo:**
- `npx tsc --noEmit` → 0 errori
- `npm run build` → "Compiled successfully"
```

---

## 4) FORMATO COMPLETION NOTES (Gemini → Claude)

Da aggiungere al checkpoint dopo l'implementazione:

```markdown
**Completion Notes (Gemini):**
- File modificati: [lista]
- Comandi eseguiti: [lista con risultati]
- Deviazioni dal checkpoint: [nessuna / descrizione]
- tsc check: ✅ / ❌
- build check: ✅ / ❌
- Push: ✅ commit [hash] / ❌ bloccato per [motivo]
- **Stato: COMPLETATO**
```

---

## 5) PROTOCOLLO DI DISACCORDO

Quando un agente non è d'accordo con un checkpoint o una decisione:
1. Descrive: problema + impatto
2. Propone: opzione A vs B con trade-off
3. Segnala: implicazioni di sicurezza se presenti
4. Tie-break di default:
   - Architettura/dati/contratti → raccomandazione Claude
   - Tooling/build/CI → raccomandazione Gemini
5. **Decisione finale: sempre Giorgio**
6. La decisione va registrata in `DECISIONS.md`

---

## 6) DEFINITION OF DONE

Nessun task è "done" finché:
- [ ] TypeScript typecheck passa (`npx tsc --noEmit`)
- [ ] Build passa (`npm run build`)
- [ ] Nessun secret nel codice o nei log
- [ ] Security baseline rispettata
- [ ] `AI_HANDOVER.md` aggiornato con Completion Notes
- [ ] Canonical artefacts aggiornati se impattati

---

## 7) SECURITY BASELINE

### 7.1 Autenticazione e Autorizzazione
- Ogni route non-pubblica deve fare authN
- Ogni risorsa protetta deve fare authZ con ownership check server-side
- Ownership check sempre inline nella query: `where: { id, userId }` — mai query separate

### 7.2 Validazione Input
- Validare sempre con Zod al boundary (API route / Server Action)
- Usare `.strict()` — rifiutare campi sconosciuti
- Mai fidarsi di ID forniti dal client per ownership

### 7.3 Secrets e Configurazione
- Secrets solo in `.env` locale — mai committati
- Nessun secret nei log
- `.env.example` sempre aggiornato con le variabili necessarie

### 7.4 Database
- Usare sempre `prisma migrate dev` — mai `prisma db push` in produzione
- Ogni schema change ha migration + rollback plan

### 7.5 Endpoint Debug
- Nessun endpoint di debug/test senza auth check
- Rimuovere endpoint diagnostici prima del deploy in produzione

---

## 8) VINCOLI ASSOLUTI

- Claude **NON fa mai `git push`** — solo Gemini, dopo QA verde
- Gemini **NON modifica schema/auth/middleware** in SOLO-FLIGHT senza approvazione Giorgio
- Qualsiasi schema Prisma change → migration obbligatoria, niente `db push`
- Qualsiasi secret nuovo → aggiornare `.env.example`

---

## 9) GOVERNANCE CEO (Giorgio)

- Giorgio decide priorità, scope, architettura finale
- Gli agenti presentano trade-off onestamente — nessun comportamento "yes-man"
- Se Giorgio richiede qualcosa che aumenta il rischio: l'agente elenca rischi e mitigazioni, poi procede

---

## 10) RISK TIERS

- **LOW:** Nessuna approvazione CEO richiesta. Gemini implementa e documenta post-merge.
- **MEDIUM:** Giorgio notificato via checkpoint. Gemini procede salvo obiezioni.
- **HIGH:** Approvazione Giorgio obbligatoria prima del merge.
- **CRITICAL:** Implementazione bloccata fino a decisione registrata in `DECISIONS.md`.

---

## 11) FILE CANONICI (Source of Truth)

In caso di conflitto, segui questo ordine di priorità:
1. `DECISIONS.md` — decisioni CEO
2. `SECURITY_BASELINE.md` — requisiti di sicurezza
3. `schema.prisma` + migrations — verità del DB
4. `API_CONTRACTS.md` — contratti delle route
5. `ARCHITECTURE.md` — moduli e confini
6. Codice — dettagli implementativi

Regola: gli agenti aggiornano i file canonici quando le modifiche li impattano. Nessun "silent drift".

---

## 12) FILE DI COORDINAMENTO

- `AI_SYNC_PROTOCOL.md` — questo documento
- `AI_HANDOVER.md` — checkpoint attivi (canale Claude ↔ Gemini)
- `DECISIONS.md` — decisioni CEO registrate
- `CLAUDE.md` — istruzioni specifiche per Claude
- `GEMINI.md` — istruzioni specifiche per Gemini

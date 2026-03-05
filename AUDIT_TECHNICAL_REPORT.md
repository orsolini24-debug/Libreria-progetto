# AUDIT_TECHNICAL_REPORT.md

## 1. Executive Technical Summary
Il progetto "Libreria-progetto" è un'applicazione web moderna per la gestione di una libreria personale, costruita su Next.js 15. Permette agli utenti di catalogare libri (manualmente o tramite Google Books), tracciare sessioni di lettura, prestiti, citazioni e personalizzare l'esperienza visuale tramite temi dinamici e configurazioni di stanza 3D (TBD).

## 2. Architettura & Flussi Dati
*   **Framework:** Next.js 15 (App Router).
*   **Data Flow:** Utilizzo di Server Actions (`app/lib/*-actions.ts`) per le mutazioni e Route Handlers (`app/api/**/*`) per interrogazioni esterne o logica granulare.
*   **ORM:** Prisma v7 con `@prisma/adapter-neon` per connessioni serverless (Neon DB).
*   **Integrazioni:** Google Books API utilizzata come proxy tramite `/api/search` e `app/lib/api/google-books.ts`.

## 3. Funzionalità (Evidence-based)
### Funzionanti
*   **Gestione Libri & Serie:** Creazione/modifica libri con navigazione inter-serie (Evidence: `app/components/books/SeriesPanel.tsx`, `app/components/books/EditBookForm.tsx`).
*   **Tracking Avanzato:** Citazioni, Prestiti, Sessioni di lettura (Evidence: `app/api/books/[id]/quotes/route.ts`, `app/api/books/[id]/loans/route.ts`, `app/api/books/[id]/sessions/route.ts`).
*   **Ricerca:** Integrazione avanzata Google Books con euristica per lingua italiana (Evidence: `app/lib/api/google-books.ts`).
*   **Esportazione:** JSON/CSV (Evidence: `app/api/export/route.ts`).

### Limitate / TBD
*   **UI Stanza 3D:** Esiste il modello (`roomConfig` in Prisma) e azioni (`updateRoomPosition`), ma il canvas 3D completo non è stato rilevato nei file principali (Evidence: `prisma/schema.prisma` riga 47).
*   **Scansione Barcode:** Presente `@zxing/browser` ma la logica di integrazione UI completa richiede investigazione (Evidence: `package.json` riga 17).

## 4. Stack Tecnologico & Versioni (Evidence: package-lock.json)
*   **Next.js:** 15.1.0
*   **React:** 19.0.0
*   **Prisma:** 7.4.1
*   **Auth.js:** 5.0.0-beta.25
*   **DB:** Neon (Serverless PostgreSQL)

## 5. Evoluzione & Git History
Il progetto ha subito una trasformazione radicale nel commit `8abaedb` ("Refactoring completo: Next.js 15, React 19..."), passando da una versione precedente a una architettura serverless moderna. I commit successivi (`afcfb47` a `8cd66ee`) hanno aggiunto granularmemte i modelli di tracking (Quote, Loan, Session).

## 6. Piano di Cleanup & Ottimizzazione
*   **P0 - Validazione Input (Rischio Alto):** Molte Server Actions non usano validatori (es. Zod). Evidence: `app/lib/book-actions.ts`.
*   **P1 - Dead Code (Rischio Basso):** Script temporanei in `app/api/admin/init-suggestions/route.ts`.
*   **P2 - Naming & Consistenza (Rischio Basso):** Alcuni campi JSON (`roomConfig`) sono debolmente tipizzati.

---

## EVIDENCE_INDEX
| Claim | File Path | Line(s) | Commit Hash |
| :--- | :--- | :--- | :--- |
| Next.js 15 | `package.json` | 23 | `5567122` |
| Prisma 7 + Neon | `app/lib/prisma.ts` | 1-20 | `16c23ca` |
| Auth.js v5 | `auth.ts` | 1 | `16c23ca` |
| Single-Query Optim. | `app/lib/book-actions.ts` | 108-135 | `43dcf45` |
| Google Books Proxy | `app/lib/api/google-books.ts` | 100-150 | `8cd66ee` |

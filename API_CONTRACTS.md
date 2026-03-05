# API_CONTRACTS.md

Rule: No endpoint is "official" unless backed by Evidence (PR/commit/checkpoint).

## Error Model (Canonical)
- Standard Response: `{ error: string }` o `{ success: string }` per Server Actions.
- HTTP Status Codes per Route Handlers (401, 404, 500).

## Contracts Index

### Libri & Tracking
#### GET `/api/books/[id]/sessions`
- **Purpose:** Recupera log di lettura.
- **Auth:** authN + authZ (owner check via query filter).
- **Evidence:** `app/api/books/[id]/sessions/route.ts` commit `3f4f887`.

#### GET `/api/books/[id]/loans`
- **Purpose:** Recupera storico prestiti.
- **Auth:** authN + authZ (owner check).
- **Evidence:** `app/api/books/[id]/loans/route.ts` commit `3f4f887`.

#### GET `/api/series`
- **Purpose:** Ricerca libri stessa serie per navigazione.
- **Auth:** authN.
- **Evidence:** `app/api/series/route.ts` commit `8cd66ee`.

### Ricerca
#### GET `/api/search?q={string}`
- **Purpose:** Proxy verso Google Books API con priorità lingua italiana.
- **Auth:** Public (client side).
- **Cache:** 5 min.
- **Evidence:** `app/api/search/route.ts`, `app/lib/api/google-books.ts` commit `8cd66ee`.

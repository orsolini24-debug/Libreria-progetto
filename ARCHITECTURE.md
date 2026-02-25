# ARCHITECTURE.md

Rule: Architecture claims must be backed by Evidence (repo link/PR/commit/checkpoint).  
If unknown, mark as TBD.

## 1) Stack
- **Framework:** Next.js 15.1.0 (App Router)
- **Runtime:** Node.js (Vercel)
- **ORM/DB layer:** Prisma v7.4.1 with `@prisma/adapter-neon` (PostgreSQL)
- **Auth:** Auth.js (NextAuth) v5.0.0-beta.25
- **UI:** React 19 + Tailwind CSS 3.4
- **Hosting:** Vercel

**Evidence:** `package.json` commit `16c23ca`, `app/lib/prisma.ts` commit `16c23ca`.

## 2) Module boundaries
- **Server Actions:** `app/lib/*.ts` gestiscono la logica di business e mutazioni DB.
- **Route Handlers:** `app/api/**/*.ts` gestiscono integrazioni esterne e API pubbliche/protette.
- **Prisma Client:** `app/generated/prisma` (custom output path).

**Evidence:** `app/lib/book-actions.ts`, `app/api/search/route.ts`.

## 3) Data flow
- **Write paths:** UI Form -> Server Action -> Prisma -> Neon DB.
- **Read paths:** Server Component -> Prisma -> Neon DB.
- **External Read:** API Client -> Google Books API -> Custom Mapping.

**Evidence:** `app/components/books/EditBookForm.tsx` -> `app/lib/book-actions.ts`.

---

## 5) Feature Log
- **2026-02-25:** Removed legacy 3D room configuration system (Commit [TBD]).
  - **Reason:** Incomplete feature, architectural simplification, and removal of weak-typed JSON fields.


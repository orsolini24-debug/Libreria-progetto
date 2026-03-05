# SECURITY_BASELINE.md (Non-negotiable)

Status: ENFORCED

## 0) Evidence rule
Any security rule that is implemented MUST reference:
- the enforcing layer (middleware, server action, controller, etc.)
- the exact file path(s)
- the PR/commit that introduced it

---

## 1) Authentication (AuthN)
- Enforced via Next.js Middleware for paths `/dashboard`, `/suggestions`, `/admin`.
- **Evidence:** `middleware.ts` commit `16c23ca`.

## 2) Authorization (AuthZ)
- Enforced at DB level by including `userId` in all `where` clauses for mutations and reads.
- **Evidence:** `app/lib/book-actions.ts` (es. `updateBook`) commit `43dcf45`.

## 3) Input validation
- [TBD] In attesa di integrazione Zod per validazione formale.
- **Evidence:** `app/lib/book-actions.ts` usa validazione manuale semplice.

## 4) Secrets & config
- Utilizzo di `.env` locale e Vercel Env Vars.
- **Evidence:** `app/lib/prisma.ts` usa `process.env.DATABASE_URL`.

---

## 5) Database Governance
- **VIETATO** l'uso di `npx prisma db push` su ambienti di produzione.
- Ogni modifica allo schema deve essere veicolata tramite migrazioni (`prisma migrate dev`).
- Eccezioni ammesse solo con Decisione Critica del CEO registrata in `DECISIONS.md` e previa conferma di backup.
- In produzione si utilizza esclusivamente `npx prisma migrate deploy`.


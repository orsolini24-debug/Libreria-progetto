# DECISIONS.md (CEO decisions & tie-break outcomes)

This file is the supreme source of truth. If something conflicts with this file, this file wins.

## Rules
- Only decisions explicitly approved by Giorgio (CEO) are valid.
- Every decision must include evidence (link to PR/commit/checkpoint).
- No assumptions allowed in this document.

---

## Decision Log

### [DEC-20260225-ROOM-REMOVAL]
- **Date:** 2026-02-25
- **Context:** Cleanup of incomplete 3D room feature.
- **Decision (CEO):** Remove all 3D room logic, UI, and schema fields.
- **Rationale:** Simplifies codebase, removes weak typing (Json field), and eliminates dead code from an incomplete legacy feature.
- **Risks accepted:** Minimal (non-production feature).
- **Mitigations:** Full QA build before push; backup via git history.
- **Affected canonical artefacts:** `schema.prisma`, `ARCHITECTURE.md`, `API_CONTRACTS.md`, `SECURITY_BASELINE.md`.
- **Owner to implement:** Gemini.
- **Evidence:** Commit `e5c7050`.
- **DB Baseline Evidence:** `npx prisma db push` (Drop colonna) seguito da `npx prisma migrate resolve` (Baseline 20260225000000_init_baseline).
- **QA evidence:** Scansione whitelist deterministica superata.



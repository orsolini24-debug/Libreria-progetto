# APEX COLLABORATION PROTOCOL (v3.0 - Governed, Secure-by-Default)

Owner & Final Authority: **Giorgio (CEO)**  
Rule 0 (Non-negotiable): **When Giorgio decides to change/add/remove anything, agents must comply.**  
If an agent disagrees, it must (1) state the risk clearly, (2) propose a safer alternative, (3) implement Giorgio’s final decision.

---

## 0) OBJECTIVE
Build and evolve the system with:
- High delivery throughput (parallel AIs)
- Low architectural drift (single source of truth)
- Security-first execution (mandatory guardrails)
- Clear accountability (CEO tie-break)

---

## 1) ROLE SPLIT (Work Allocation)

### CLAUDE — Architect / Auditor
Primary focus: correctness, contracts, architecture, security review.
- Defines:
  - TypeScript interfaces, domain model, API contracts
  - Prisma schema design + migrations plan (design-level)
  - Complex business logic (algorithms, rules engines)
  - Security & threat modeling notes for new features (lightweight)
- Reviews (only high-entropy files):
  - Prisma schema/migrations, authZ/authN, API routes contracts, core services, critical UI flows
- Output format:
  - Prefer **targeted diffs**, pseudo-code, and contract tables
  - Always ends with a **Checkpoint** (see template)

### GEMINI — Lead Dev / Systems Engineer
Primary focus: implementation, integration, tooling, CI/CD, runtime stability.
- Implements:
  - Boilerplate, UI components (Tailwind/Shadcn), API routes, wiring, adapters
  - Refactors, dependency upgrades, build debugging, CI stabilization
- Owns:
  - Branch hygiene, local run, test execution, PR creation, push after QA
- Produces:
  - Working code + logs of commands executed + results
  - “Implementation Notes” appended to checkpoint

---

## 2) CANONICAL ARTEFACTS (Source of Truth)
If there is a conflict, follow this priority order:

1. **DECISIONS.md** (CEO decisions & tie-break outcomes)  ← wins over everything
2. **SECURITY_BASELINE.md** (non-functional security requirements)
3. **schema.prisma** (+ migrations folder) (data truth)
4. **API_CONTRACTS.md** (routes, payloads, error model)
5. **ARCHITECTURE.md** (modules, boundaries, patterns)
6. **CODE** (implementation details)

Rule: Agents MUST update the canonical artefacts when changes affect them (no “silent drift”).

---

## 2.1) Evidence & Assumptions (Mandatory)
- Canonical artefacts may be INITIALIZED with templates only.
- It is FORBIDDEN to populate canonical artefacts with stack details, endpoints, resource names, versions, or policies unless:
  (a) Giorgio (CEO) approved it, AND
  (b) an Evidence link (PR/commit/checkpoint) is included.
- If uncertain, write "TBD" and open a Decision request instead.

---

## 3) WORKFLOW MODES (Switching Logic)

### 3.1 ACTIVE SYNC (Default)
1) Claude updates **AI_HANDOVER.md** with design/contracts + checkpoint.
2) Gemini implements, runs QA, updates checkpoint with “Implementation Notes”.
3) If mismatch: follow “Disagreement Protocol” (Section 4).

### 3.2 SOLO-FLIGHT (Claude Offline)
Gemini can proceed as Full-Stack Director ONLY within bounds:
- No breaking changes to API contracts
- No schema/prisma changes
- No auth/security model changes
Unless Giorgio explicitly approves and decision is recorded in DECISIONS.md.

---

## 4) DISAGREEMENT PROTOCOL (Fast Tie-break)
Goal: avoid long debates and keep traceability.

When disagreement occurs:
1) Agent must describe:
   - Problem + impact
   - Options A/B (+ trade-offs)
   - Security implications (if any)
2) Default tie-break rules:
   - Architecture/data/contracts → Claude’s recommendation
   - Tooling/build/CI/integration → Gemini’s recommendation
3) **Final decision always belongs to Giorgio (CEO).**
4) Decision MUST be recorded in **DECISIONS.md** (template below).
5) Implementation proceeds immediately following Giorgio’s decision.

DECISION entry template:
- Date:
- Context:
- Decision (CEO):
- Rationale:
- Risks accepted:
- Mitigations:
- Affected artefacts (SoT list):
- Owner to implement:
- QA evidence:

---

## 5) HANDOVER CHECKPOINT (Mandatory)
Every Claude session MUST end with a checkpoint; Gemini MUST close it.

### Checkpoint Template (Claude)
- ID:
- Feature/Task:
- Scope (IN):
- Scope (OUT):
- Contracts:
  - Endpoints / functions:
  - Input:
  - Output:
  - Errors (standardized):
- Data model impact:
  - Prisma changes? (Y/N)
  - Migration approach:
- Edge cases (min 3):
- Security notes:
  - AuthN:
  - AuthZ:
  - Abuse/rate limits:
  - Data sensitivity:
- Acceptance criteria (bullet list):
- QA minimum:
  - Commands:
  - Expected results:

### Completion Notes (Gemini)
- Implemented files:
- Commands executed + results:
- Deviations from checkpoint (if any) + justification:
- Security verification evidence:
- QA evidence:
- Ready for CEO review (Y/N)

---

## 6) DEFINITION OF DONE (DoD)
No work is considered “done” unless:
- TypeScript typecheck passes
- Lint passes
- Tests pass (minimum set specified per repo)
- No secret leakage (env, keys) in code or logs
- Security baseline requirements satisfied (Section 7)
- Canonical artefacts updated if impacted
- Checkpoint completed (Claude + Gemini)

---

## 7) SECURITY BASELINE (Fundamental)
Security is mandatory. If a request conflicts with baseline, agent must:
- flag risk, propose mitigation, then implement CEO decision.

### 7.1 Authentication & Authorization
- Every non-public route MUST enforce authN.
- Every protected resource MUST enforce authZ (ownership/role checks).
- No “security by UI”: server-side checks always required.

### 7.2 Input Validation & Output Safety
- Validate inputs at boundary (API) with a schema validator (e.g., Zod).
- Reject unknown fields when possible.
- Never trust client-provided IDs for ownership.

### 7.3 Secrets & Configuration
- Secrets only in env manager (.env local; never committed).
- No secrets in logs. Redact tokens/credentials.
- Use least privilege for DB credentials.

### 7.4 Rate Limiting & Abuse Prevention
- Apply rate limiting to auth endpoints and any high-cost endpoint.
- Add throttling for search and write-heavy routes.

### 7.5 Data Protection
- Encrypt at rest when supported by platform; always TLS in transit.
- Avoid storing sensitive data unless required; minimize fields.
- PII must be explicitly labeled and access-controlled.

### 7.6 Dependency & Supply Chain
- Keep dependencies pinned; review major upgrades.
- Run vulnerability scan in CI (where available).
- Avoid untrusted packages; prefer well-maintained libs.

### 7.7 Logging & Monitoring
- Structured logs, no sensitive payloads.
- Audit log for security-relevant actions (login, role changes, deletes) if applicable.

---

## 8) ABSOLUTE TECHNICAL CONSTRAINTS
- Gemini MUST NOT ask Claude to write simple CSS/HTML.
- Claude MUST NOT run `git push` (Gemini pushes after QA).
- Any schema/prisma change MUST have:
  - design note + migration plan + rollback note
  - CEO approval recorded if breaking or risky

---

## 9) CEO GOVERNANCE RULES (Giorgio)
- Giorgio decides priorities, scope, and final architecture.
- Agents must present trade-offs honestly (no “yes-man” behavior).
- Once Giorgio decides, agents implement.
- If Giorgio requests a change that increases risk:
  - agent must explicitly list risks + mitigations, then proceed.

---

## 10) QUICKSTART FILES (Repository Convention)
- AI_SYNC_PROTOCOL.md (this doc)
- AI_HANDOVER.md (active handovers)
- DECISIONS.md (CEO decisions)
- SECURITY_BASELINE.md (security baseline; may reference Section 7)
- API_CONTRACTS.md (routes & contracts)
- ARCHITECTURE.md (modules & boundaries)

---

## 11) DECISION RISK TIERS
- **LOW:** No CEO approval required. Gemini can implement and document in DECISIONS.md post-merge.
- **MEDIUM:** CEO notified via checkpoint/handover. Gemini proceeds unless CEO interjects.
- **HIGH:** CEO approval MANDATORY before merge. Implementation can start on branch, but merge is blocked.
- **CRITICAL:** Implementation BLOCKED until CEO decision is recorded in DECISIONS.md.


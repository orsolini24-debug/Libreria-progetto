# SECURITY_BASELINE.md (Non-negotiable)

Status: BASELINE (applies to all stacks)

## 0) Evidence rule
Any security rule that is implemented MUST reference:
- the enforcing layer (middleware, server action, controller, etc.)
- the exact file path(s)
- the PR/commit that introduced it

If evidence is missing, the rule is NOT considered implemented.

---

## 1) Authentication (AuthN)
- All non-public operations require AuthN on the server side.
- Sessions/tokens must be validated server-side, not via UI gating.

## 2) Authorization (AuthZ)
- Every operation on user-scoped resources must enforce ownership/role checks server-side.
- Never rely on client-provided `userId` or ownership hints.

## 3) Input validation
- Validate all external inputs at boundaries (HTTP, server actions, webhooks).
- Prefer explicit allowlists; reject unknown fields where feasible.

## 4) Secrets & config
- Secrets never committed.
- Logs must redact tokens/credentials/PII.
- DB credentials least privilege.

## 5) Abuse controls
- Rate-limit auth endpoints and high-cost endpoints.
- Add throttling for search and write-heavy routes.

## 6) Data protection
- TLS in transit.
- Minimize PII storage; classify data sensitivity.
- Backups and retention rules documented.

## 7) Supply chain
- Pin deps where possible; review major upgrades.
- Automated vulnerability scanning in CI (if CI exists).

## 8) Auditability
- Security-relevant actions should emit audit events where applicable (auth events, deletes, permission changes).

---

## Implementation Evidence Index (fill only with proof)
- AuthN enforcement:
  - Evidence:
- AuthZ enforcement:
  - Evidence:
- Input validation:
  - Evidence:
- Rate limiting:
  - Evidence:
- Logging redaction:
  - Evidence:

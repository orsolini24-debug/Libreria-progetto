# API_CONTRACTS.md

Rule: No endpoint is "official" unless backed by Evidence (PR/commit/checkpoint).

## Error Model (Canonical)
- Provide: error_code, message, correlation_id (if available)
- Never leak internal stack traces to clients

## Contracts Index (Template)
### <GROUP / DOMAIN>
#### <METHOD> <PATH>
- Purpose:
- Auth: public | authN | authN+authZ
- Input:
- Output:
- Errors:
- Rate limit: Y/N (policy)
- Evidence (PR/commit/checkpoint):

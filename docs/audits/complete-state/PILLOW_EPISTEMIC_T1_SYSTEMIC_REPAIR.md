# Pillow Birth T1 — Systemic Epistemic Repair

**Birth authorised:** NO  
**Birth timestamp:** NULL  
**Sealed exam executed by Cursor:** NO  
**T2:** NOT STARTED  

## Root failure class

Inadequate **epistemic / provenance boundary**: narrative phrases were treated as evidence; personal retrieval verbs were allowed without attestation; historical “not yet in production” language outranked live deploy identity.

## Architecture shipped

| Module | Role |
|---|---|
| `pillow-capability-registry.ts` | Machine-readable exists≠used capability map |
| `executive-epistemic-grounding.ts` | Attestation ledger, claim detectors, fail-closed retractions |
| `executive-truth-grounding.ts` | Integrates epistemic brief + post-LLM enforcement |
| `pillow-host.ts` | Attests snapshot reads per request; passes ledger into enforcer |

## Proof

- **Round A:** `executive-epistemic-grounding.test.ts` — PASS  
- **Round B:** `pillow-epistemic-adversarial-cert.mjs` — 12/12 PASS (randomized entities; no sealed Q&A)  
- **Round C:** live production after deploy (synthetic probes only)

## Anti-gaming

No sealed T1 questions, expected exam wording, or exam-answer fixtures encoded.

# PILLOW T1 Epistemic Repair — Round 3

**Baseline:** `3e267461` → Round-3 ship  
**Birth:** FORBIDDEN  

## Failure class

Epistemic overcorrection + GK UX leakage: Round-2 release gate replaced contaminated drafts with a canned CURRENT_VERIFIED dump (IDs/SHAs/enums/authority boilerplate), suppressing legitimate labeled inference and making conversation look like an audit console.

## Fix

- Claim-level surgical repair (`surgicalRepairDraft`)
- Natural executive surface (`executive-conversation-surface.ts`)
- Task-intent + progressive disclosure
- Labeled inference allowed; fabrication still blocked
- Round-2 pre-release gate preserved (no appendix escape hatch)

## Tests

| Round | Result |
|------|--------|
| A | 30/30 PASS |
| B | see adversarial evidence |
| C | after deploy |

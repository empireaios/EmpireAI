# Q0-02 Opportunity Scanner

**Status:** FINAL PASS  
**Doctrine:** PILLOW-OSC-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-02 Opportunity Scanner  
**Primary Deliverable:** Continuously discovers profitable business and operational opportunities for Pillow review.

## How Q0-02 works

1. Pillow configures opportunity domains (`configureDomains` / `POST /api/pillow/opportunity-scanner/configure-domains`).
2. The scanner discovers business and/or operational opportunities from structural domain blueprints.
3. Records are normalized and scored (relevance, profit potential, feasibility, confidence, risk).
4. Opportunities are marked `pending_pillow_review` for Pillow — never executed, approved, assigned, or turned into businesses by this module.

## Boundaries

| Allowed | Forbidden |
|---------|-----------|
| Configure domains | Execute opportunities |
| Discover & score | Approve opportunities |
| Mark for Pillow review | Assign workers |
| Validate records | Create businesses |

## Verification

`npx --yes tsx --test "src/validation/tests/opportunity-scanner.test.ts"` — 10 passing, 0 failing.

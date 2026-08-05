# Q0-23 Knowledge Sharing Bus

**Status:** FINAL PASS  
**Doctrine:** PILLOW-KSB-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-23 Knowledge Sharing Bus  
**Primary Deliverable:** Allows workers to share discoveries, patterns, lessons, playbooks and reusable context.

> Doctrine ID uses **PILLOW-KSB-001**. Knowledge Sharing Bus distributes organizational knowledge and never performs business work.

## How Q0-23 works

1. Workers submit discoveries to the authoritative Knowledge Sharing Bus.
2. Knowledge is validated, classified, categorized, and versioned.
3. Published knowledge is shared to subscribed/authorized workers through Pillow.
4. Usage is tracked; obsolete knowledge can be archived.
5. Every asset emits a machine-readable Knowledge Record (`KSB-001-v1`).
6. Knowledge Sharing Bus never executes worker tasks, replaces Execution Memory, replaces Decision Memory, overrides Pillow, or overrides Grand King.

## Knowledge categories

`lessons_learned`, `best_practice`, `business_knowledge`, `operational_knowledge`, `technical_knowledge`, `market_intelligence`, `customer_intelligence`, `financial_knowledge`, `executive_knowledge`, `recovery_knowledge`

## Verification

`npx --yes tsx --test "src/validation/tests/knowledge-sharing-bus.test.ts"` — 10 passing, 0 failing.

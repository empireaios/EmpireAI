# Q5-06 Template Builder Worker Certification

## Mission

- **ID:** Q5-06
- **Name:** Template Builder Worker
- **Doctrine:** PILLOW-TBW-001
- **Module:** `pillow/src/template-builder-worker/`
- **Status:** FINAL PASS

## Deliverable

Create templates, spreadsheets, prompts, planners, contracts, and reusable assets — content creation only under Pillow.

## Capabilities verified

1. Receive approved Digital Product Research
2. Generate reusable templates
3. Generate planners
4. Generate spreadsheets
5. Generate contracts and document templates
6. Generate business forms and checklists
7. Generate reusable prompt libraries where applicable
8. Validate usability and completeness
9. Prepare export-ready template packages
10. Produce machine-readable Template Builder Reports

## Boundaries verified

- Does not build sales pages
- Does not process payments
- Does not deliver products to customers
- Does not publish products directly
- Does not override Pillow
- Does not override Grand King
- Does not implement Q5-07 or later

## Integrations

- Worker Registry
- Worker Lifecycle
- Worker Assignment Engine
- Digital Products Factory Core
- Digital Product Research Worker
- Executive Reporting Runtime
- Worker Performance Review
- Worker Recovery System

## Validation

Unit tests: `pillow/src/validation/tests/template-builder-worker.test.ts` — 10/10 pass.

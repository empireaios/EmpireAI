# Q5-05 Course Builder Worker Certification

## Mission

- **ID:** Q5-05
- **Name:** Course Builder Worker
- **Doctrine:** PILLOW-CBW-001
- **Module:** `pillow/src/course-builder-worker/`
- **Status:** FINAL PASS

## Deliverable

Produce online courses with lessons, modules, quizzes, and resources — content creation only under Pillow.

## Capabilities verified

1. Receive approved Digital Product Research
2. Design complete course curriculum
3. Organize modules
4. Create lessons
5. Generate quizzes and assessments
6. Generate downloadable resources
7. Create learning objectives
8. Validate instructional flow
9. Package export-ready course assets
10. Produce machine-readable Course Builder Reports

## Boundaries verified

- Does not build sales pages
- Does not process payments
- Does not deliver courses to customers
- Does not publish courses directly
- Does not override Pillow
- Does not override Grand King
- Does not implement Q5-06 or later

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

Unit tests: `pillow/src/validation/tests/course-builder-worker.test.ts` — 10/10 pass.

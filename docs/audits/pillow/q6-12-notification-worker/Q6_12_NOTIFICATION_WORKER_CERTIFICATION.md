# Q6-12 Notification Worker Certification

## Mission

- **ID:** Q6-12
- **Name:** Notification Worker
- **Doctrine:** PILLOW-NTW-001
- **Module:** `pillow/src/notification-worker/`
- **Status:** FINAL PASS

## Deliverable

Unified notification platform for email, SMS, Telegram, WhatsApp, push, and in-app channels with templates, queues, retries, delivery tracking, audit history, and machine-readable Notification Reports.

## Repository audit findings

- Q6-01–Q6-11 FINAL PASS verified from certification evidence under `docs/audits/pillow/q6-0*` / `q6-1*`.
- Adjacent `banking-notification-handler` preserved; WBW/AIW business logic not replaced.
- Delivery success recorded only from explicit transport outcomes; secrets never exposed.

## Capabilities verified

1. Register notification providers
2. Email notifications
3. SMS notifications
4. Telegram notifications
5. WhatsApp notifications
6. Internal/in-app notifications
7. Templated notifications with variable substitution
8. Notification queues and retries
9. Notification audit history
10. Notification Reports (`NTW-RPT-v1`)

## Boundaries verified

- Does not replace workflow orchestration
- Does not replace business logic
- Never exposes credentials or secrets
- Never fabricates delivery results
- Does not override Pillow / Grand King / approved architecture
- Does not implement Q6-13 or later

## Prerequisites

Q6-01 through Q6-11 FINAL PASS.

## Wiring

- Session bootstrap after Workflow Builder Worker
- Barrel export + `requirePillowNotificationWorker()`
- Subsystem registry id `notification-worker` (mission Q6-12)
- Host methods + authenticated routes `/api/pillow/notification-worker/*`
- Offline bridge: `notification-worker-bridge.ts`

## Evidence

- Unit suite: `pillow/src/validation/tests/notification-worker.test.ts` (12/12)
- Regression: Q6-11 Workflow Builder Worker (12/12)
- Governance: `docs/governance/EMPIREAI_NOTIFICATION_WORKER_SYSTEM.md`
- Config: `config/notification-worker.config.json`

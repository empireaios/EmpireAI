# Q0-24 Inter-Worker Messaging

**Status:** FINAL PASS  
**Doctrine:** PILLOW-IWM-001  
**Programme:** Q0 — Executive Intelligence Factory  
**Mission:** Q0-24 Inter-Worker Messaging  
**Primary Deliverable:** Standardizes communication between workers with traceable messages and task context.

> Doctrine ID uses **PILLOW-IWM-001**. Inter-Worker Messaging transports executive communication only and never performs worker tasks.

## How Q0-24 works

1. Worker A sends a structured message through the authoritative Inter-Worker Messaging service.
2. Mission and business context are attached; messages are routed and delivery is tracked.
3. Worker B receives and can reply within the same conversation.
4. Pillow can inspect searchable communication history.
5. Every exchange emits a machine-readable Message Record (`IWM-001-v1`).
6. Inter-Worker Messaging never executes worker logic, modifies worker decisions, replaces Workforce Orchestrator, overrides Pillow, or overrides Grand King.

## Message types

`task_request`, `task_response`, `information`, `review_request`, `review_response`, `approval_request`, `approval_response`, `escalation`, `broadcast`, `system_notification`

## Delivery states

`queued`, `sent`, `delivered`, `read`, `acknowledged`, `failed`, `expired`

## Verification

`npx --yes tsx --test "src/validation/tests/inter-worker-messaging.test.ts"` — 10 passing, 0 failing.

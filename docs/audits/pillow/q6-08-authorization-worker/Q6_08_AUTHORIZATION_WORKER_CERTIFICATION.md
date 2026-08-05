# Q6-08 Authorization Worker Certification

## Mission

- **ID:** Q6-08
- **Name:** Authorization Worker
- **Doctrine:** PILLOW-AZW-001
- **Module:** `pillow/src/authorization-worker/`
- **Status:** FINAL PASS

## Deliverable

Build roles, permissions, policies, and access control for authenticated principals. Consume identities from Q6-07 Authentication Worker. Default-deny, least-privilege, deny-overrides-allow, role inheritance, authorization audit, Authorization Build Reports.

## Repository audit findings

- Q6-01–Q6-07 FINAL PASS verified from certification evidence.
- Canonical control-plane RBAC remains `backend/src/auth/permissions.ts` (reference only; not replaced).
- Authority Matrix / Workforce Access Manager are separate domains — not collided.
- Authentication Worker (`PILLOW-ATW-001`) provides `validateSession` / authenticated identity consumption.

## Capabilities verified

1. Consume authenticated identities from Q6-07
2. Role management
3. Permission management
4. Policy-based authorization
5. Resource-level authorization
6. Action-level authorization
7. Role inheritance
8. Authorization decision evaluation
9. Authorization audit events
10. Machine-readable Authorization Build Reports

## Boundaries verified

- Does not authenticate users
- Does not replace Authentication Worker
- Does not override Pillow / Grand King / approved architecture
- Does not implement Q6-09 or later
- Default deny when authorization cannot be established

## Prerequisites

Q6-01 through Q6-07 FINAL PASS.

## Evidence

- Unit suite: `pillow/src/validation/tests/authorization-worker.test.ts` (12/12)
- Governance: `docs/governance/EMPIREAI_AUTHORIZATION_WORKER_SYSTEM.md`
- Config: `config/authorization-worker.config.json`
- Host bridge + routes: `/api/pillow/authorization-worker/*`

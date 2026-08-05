# Q6-07 Authentication Worker Certification

## Mission

- **ID:** Q6-07
- **Name:** Authentication Worker
- **Doctrine:** PILLOW-ATW-001
- **Module:** `pillow/src/authentication-worker/`
- **Status:** FINAL PASS

## Deliverable

Convert approved Requirements and Architecture Reports into secure, production-ready authentication capabilities: user accounts, registration, login/logout, opaque sessions, scrypt password storage, recovery, verification, abuse protection, and Authentication Build Reports.

## Repository audit findings

- Canonical live EmpireAI control-plane auth remains `backend/src/auth/` (bcryptjs + opaque sessions). This worker does **not** replace that stack.
- Factory Authentication Worker provides a real, unit-testable auth runtime for platforms built by Q6, following the same opaque-session / fail-closed patterns.
- Password hashing uses `node:crypto` scrypt (repository-approved Node crypto). Sessions and recovery tokens are hashed at rest (SHA-256).
- Authorization (roles, permissions, ACL) is explicitly out of scope for Q6-08.

## Capabilities verified

1. Receive approved requirements and architecture reports
2. Create and manage user accounts
3. Account registration
4. Secure login and logout
5. Session create / validate / renew / revoke
6. Secure password storage and credential validation
7. Forgotten-password / password-reset (generic, single-use, expiring)
8. Account verification
9. Authentication failure handling and lockout
10. Machine-readable Authentication Build Reports

## Security verified

- No plaintext password storage
- No passwords/tokens/secrets in logs, audit events, or build reports
- Opaque sessions with expiry, rotation, and revocation
- Recovery responses do not enumerate accounts; tokens delivered via approved notification capability
- Fail-closed on invalid/expired/revoked sessions
- Authentication kept separate from authorization

## Integrations

Worker Registry, Worker Lifecycle, Worker Assignment Engine, EPFC, Requirements Worker, Architecture Worker, Backend Worker, Database Worker, Executive Reporting Runtime, Worker Performance Review, Worker Recovery System, Audit Runtime, Approved Notification Capability.

## Prerequisites

Q6-01 through Q6-06 FINAL PASS.

## Evidence

- Unit suite: `pillow/src/validation/tests/authentication-worker.test.ts` (12/12)
- Governance: `docs/governance/EMPIREAI_AUTHENTICATION_WORKER_SYSTEM.md`
- Config: `config/authentication-worker.config.json`
- Host bridge: `backend/src/orchestration/pillow-host/authentication-worker-bridge.ts`
- Routes: `/api/pillow/authentication-worker/*`

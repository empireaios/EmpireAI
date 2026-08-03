# EmpireAI Authorization Worker System

The Authorization Worker (PILLOW-AZW-001, Q6-08) is the Enterprise Platform Factory authorization worker. It consumes authenticated identities from the Authentication Worker (Q6-07) and never authenticates users, stores credentials, or replaces the authentication worker.

The worker applies default-deny, least-privilege authorization. Explicit deny policies always override allows. Roles can inherit parent roles; policy matching supports resource and action wildcards. Authorization audit records contain decisions and redacted summaries rather than security configuration dumps.

Administrative grants require an assigner who already holds the same administrative role. The sole bootstrap exception permits the first assignment of an administrative role when no principal holds it; this exception is auditable. The worker preserves approved requirements and architecture and does not implement Q6-09 or later.

`backend/src/auth/permissions.ts` is referenced as the canonical control-plane RBAC pattern only. This worker does not replace it, the authority matrix, or the workforce access manager.

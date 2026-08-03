# EmpireAI Authentication Worker System

The Authentication Worker (PILLOW-ATW-001, Q6-07) is the Enterprise Platform Factory worker for real, unit-testable platform authentication. It follows the opaque-session and fail-closed architectural patterns used by the canonical EmpireAI control-plane implementation at `backend/src/auth/`; it does not create or replace that control-plane login stack.

Passwords are never stored in plaintext. The worker uses `node:crypto` `scrypt` with per-password salts, `timingSafeEqual` verification, cryptographically random opaque tokens, and SHA-256 token hashes at rest. Sessions and recovery tokens expire; recovery tokens are single-use. Audit records and reports redact sensitive values.

Authentication is deliberately separate from authorization. This worker does not implement Q6-08 authorization, roles, permissions, ACLs, or policy-based access control. It preserves approved requirements and architecture, Pillow and Grand King authority, audit history, traceability, and fail-closed behavior when authentication state cannot be verified.

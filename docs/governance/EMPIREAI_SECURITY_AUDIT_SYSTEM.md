# EmpireAI Security Audit

PILLOW-SECART-001 / Q11-05 provides the Security Audit — the fifth acceptance gate of the Q11 Production Certification series.

The Security Audit **discovers, verifies, and classifies** whether every security component is enterprise-ready, from observed structural evidence only. It discovers security components strictly from injected dependency handles — never inventing components — cross-referenced against the read-only `SECURITY_COMPONENT_KEYS` catalog (`authentication-worker`, `authorization-worker`, `authority-matrix`, `api-runtime`, `audit-runtime`, `monitoring-runtime`, `production-certification-core`, `executive-reporting-runtime`, `tool-runtime`, and the structural `secret-management` composite). For each discovered component it verifies authentication, authorization, RBAC/permission enforcement, secret management (presence/masking capability evidence only — it never reads or logs secret values), API security, data protection, runtime security, and operational security from observed structural evidence only (method presence, configuration flag presence — never execution of real credentials or business logic). It classifies each component's security readiness deterministically from this evidence — `certified`, `partially_certified`, `failed`, `missing`, `blocked`, or `deferred` — and it never certifies an insecure implementation. It aggregates every finding into a `SecurityAssessment` matrix, calculates a deterministic overall readiness score, tracks immutable audit history, and produces a machine-readable Security Audit Report.

The Security Audit reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It preserves complete traceability and immutable audit history. It is the fifth acceptance gate of the Q11 series — it never implements Q11-06 (Performance Audit) or later. It exposes a `Q1106ConsumableContract` (via `getQ1106ConsumableContract()`) that Q11-06 may consume; it never implements Q11-06 itself. It consumes the `Q1105ConsumableContract` exposed by Q11-04 (Business Factory Audit) when the `businessFactoryAudit` dependency is injected — it never re-implements that business-readiness authority.

## Workflow

1. Discover every security component strictly from injected dependency handles (`authenticationWorker`, `authorizationWorker`, `authorityMatrix`, `apiRuntime`, `auditRuntime`, `monitoringRuntime`, `productionCertificationCore`, `executiveReportingRuntime`, `toolRuntime`). Absence of an injected handle is reported as zero discovered evidence for that component — components are never invented.
2. Verify authentication: presence of identity-provider capability methods (`login`, `registerAccount`, `validateSession`, `requestPasswordReset`, `resetPassword`, `verifyAccount`) on the injected Authentication Worker.
3. Verify authorization and RBAC/permission enforcement: presence of access-control capability methods (`evaluateAccess`, `createRole`, `assignRole` on the Authorization Worker; `validateWorkerAuthority`, `validateApprovalRouting`, `deriveAuthority` on the Authority Matrix).
4. Verify secret management: presence of configuration flags (`maskSensitiveValues`, `neverStorePlaintextPasswords`, `neverExposeSecretsInLogsOrReports`) on the injected Authentication Worker's reported configuration — secret values themselves are never read, logged, or reported.
5. Verify API security: presence of auth-manager/permission-gate/rate-limiter structural methods (`authenticate`, `routeRequest`, `checkHealth`) on the API Runtime and Tool Runtime.
6. Verify data protection: mirrors secret-management evidence — masking/vault capability presence only.
7. Verify runtime security: reported health/state capability presence on each bound component (Monitoring Runtime, Production Certification Core, Audit Runtime integrity checks).
8. Verify operational security: audit-logging and reporting capability presence (`recordEvent`, `verifyIntegrity`, `query` on Audit Runtime; `submitWorkerReport` on Executive Reporting Runtime; `getDashboard`/`generateAlerts` on Monitoring Runtime).
9. Classify each component's security readiness deterministically from the seven dimensions above (authentication, authorization, secret, API security, data protection, runtime security, operational security): `certified`, `partially_certified`, `failed`, `missing`, `blocked`, or `deferred`. A component only reaches `certified` when every dimension is `Passed` — an insecure implementation is never certified.
10. Produce a machine-readable Security Audit Report (`SECART-RPT-v1` / `SECART-001-v1`) documenting every component assessment, dimension summaries, governance summary, outstanding risks, critical findings, and confidence score, plus `consumableByQ1106` and the `Q1106ConsumableContract` exposed for Q11-06.
11. Submit findings through the Executive Reporting Runtime and preserve complete, immutable audit history.

## Security Assessment model

Each row of the `assessments` matrix records: `securityCheckId`, `componentId`, `componentType`, `authenticationStatus`, `authorizationStatus`, `secretStatus`, `apiSecurityStatus`, `dataProtectionStatus`, `runtimeSecurityStatus`, `operationalSecurityStatus`, `readinessClassification`, `supportingEvidence`, `auditReference`, `auditTimestamp`.

## Integrations

The worker integrates with:

- Business Factory Audit (Q11-04) — consumes `getQ1105ConsumableContract()`
- Production Certification Core (Q11-01)
- Authentication Worker — identity-provider structural evidence
- Authorization Worker — access-control structural evidence
- Authority Matrix — RBAC/authority-routing structural evidence
- API Runtime — API security structural evidence
- Tool Runtime — tool auth-manager structural evidence (optional)
- Monitoring Runtime — operational security signal
- Audit Runtime — audit-logging signal
- Executive Reporting Runtime — `submitWorkerReport`
- Shared Runtime Core, Worker Registry, Pillow Orchestration Runtime — worker identity provisioning

## Boundaries

The Security Audit:

- **does** discover every security component strictly from injected dependency handles
- **does** verify authentication, authorization, RBAC, secret management, API security, data protection, runtime security, and operational security from observed structural evidence only
- **does** classify security readiness deterministically and calculate an overall confidence score
- **does** expose a `Q1106ConsumableContract` for Q11-06 (Performance Audit) to consume
- **does** consume the `Q1105ConsumableContract` exposed by Q11-04 (Business Factory Audit) when injected
- does **not** fabricate security evidence
- does **not** certify insecure implementations
- does **not** expose secrets during auditing (never logs or reports token/password/api-key/secret values)
- does **not** assume implementation
- does **not** modify security implementations
- does **not** repair failed security components
- does **not** bypass Pillow governance
- does **not** bypass Grand King approval
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q11-06 (Performance Audit) or later

## Stop Boundary

Q11-05 is the fifth acceptance gate of the Production Certification series. Q11-06 (Performance Audit) is explicitly out of scope; Security Audit only exposes the `Q1106ConsumableContract` for that future mission to consume.

## Distinctness

Security Audit (`pillow/src/security-audit/`, SECART, Q11-05) is distinct from:

- Business Factory Audit (`pillow/src/business-factory-audit/`, BFART, Q11-04), which certifies whether every business factory is enterprise-ready (registration, workers, workflow, runtime, integration, governance, operational) — Security Audit consumes its `Q1105ConsumableContract` but focuses exclusively on security readiness (authentication, authorization, secrets, API security, data protection, runtime security, operational security).
- Authentication Worker (`pillow/src/authentication-worker/`, PILLOW-ATW), which actually performs login, registration, session validation, and password reset — Security Audit only probes its capability method and configuration-flag presence structurally and never invokes it to move real credentials.
- Authorization Worker (`pillow/src/authorization-worker/`, PILLOW-AZW) and Authority Matrix (`pillow/src/authority-matrix/`, PILLOW-AMX), which actually evaluate access and derive authority — Security Audit only probes their capability method presence structurally and never mutates real roles or routing.
- Production Certification Core (`pillow/src/production-certification-core/`, PCCRT, Q11-01), which certifies overall production readiness (programmes, factories, runtimes) — Security Audit focuses exclusively on per-component security readiness.
- `empire-audit-intelligence`'s `SecurityAudit` type alias (backend package), which is an unrelated reporting type in a different subsystem — this Pillow `SecurityAudit` class is path-qualified under `pillow/src/security-audit/` and does not interact with that package.

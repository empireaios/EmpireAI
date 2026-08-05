# EmpireAI Business Factory Audit

PILLOW-BFART-001 / Q11-04 provides the Business Factory Audit — the fourth acceptance gate of the Q11 Production Certification series.

The Business Factory Audit **discovers, verifies, and classifies** whether every business factory is enterprise-ready, from observed evidence only. It discovers every business factory strictly from an injected Shared Runtime Core (`listFactories()` / `getCatalog().factories` / `getTopology().factories`) — never inventing factories; it cross-references the read-only `FACTORY_KEYS` catalog (`workforce-os`, `workforce`, `empire-builder-factory`, `commerce-factory`, `media-factory`, `digital-products-factory`, `enterprise-platform-factory`, `local-business-factory`, `affiliate-factory`, `capital-factory`) only as evidence, never as a discovery source itself. For each discovered factory it verifies registration (a dedicated `*FactoryCore` handle for commerce/media/digital-products/enterprise-platform/local-business/affiliate/capital/empire-builder factories, or Worker Registry + workforce presence for `workforce-os`/`workforce`), worker coverage (`worker.factory` matching the factory key), workflow dispatch (`pillowOrchestrationRuntime.invokeWorker` presence — a structural, presence-only probe that never executes real factory business logic), runtime integration (Shared Runtime Core binding + reported factory health status), external integrations (Production Certification Core, Monitoring Runtime, Audit Runtime presence), governance (Pillow Command Audit binding + assigned worker certification standing), and operational readiness (reported health status + evidence-present flag). It classifies each factory's business readiness deterministically from this evidence — `certified`, `partially_certified`, `failed`, `missing`, `blocked`, or `deferred` — and it never certifies an incomplete workflow or a missing integration. It aggregates every finding into a `BusinessFactoryAssessment` matrix, calculates a deterministic overall readiness score, tracks immutable audit history, and produces a machine-readable Business Factory Audit Report.

The Business Factory Audit reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It preserves complete traceability and immutable audit history. It is the fourth acceptance gate of the Q11 series — it never implements Q11-05 (Security Audit) or later. It exposes a `Q1105ConsumableContract` (via `getQ1105ConsumableContract()`) that Q11-05 may consume; it never implements Q11-05 itself. It consumes the `Q1104ConsumableContract` exposed by Q11-03 (Pillow Command Audit) when the `pillowCommandAudit` dependency is injected — it never re-implements that command-control authority.

## Workflow

1. Discover every business factory strictly from an injected `sharedRuntimeCore` handle (`listFactories()` / `getCatalog().factories` / `getTopology().factories`). Absence of an injected handle is reported as zero discovered factories — factories are never invented.
2. Verify factory registration: presence in Shared Runtime Core discovery, plus a dedicated `*FactoryCore` handle for factories that require one, or Worker Registry + workforce presence for `workforce-os`/`workforce`.
3. Verify worker coverage: at least one worker with `worker.factory` matching the factory key, discovered strictly from the injected Worker Registry.
4. Verify workflow dispatch: probe `pillowOrchestrationRuntime.invokeWorker` presence when injected. This is presence/capability evidence only — `invokeWorker` is never actually called, so no business logic is executed.
5. Verify runtime integration: Shared Runtime Core binding + a reported factory health status.
6. Verify external integrations: Production Certification Core, Monitoring Runtime, and Audit Runtime presence as shared operational infrastructure.
7. Verify factory governance: Pillow Command Audit binding (Q11-03 governance chain) plus certification standing of any workers assigned to the factory — Pillow governance is required and never bypassed.
8. Verify operational readiness: reported factory health status plus evidence-present flag from Shared Runtime Core discovery.
9. Classify each factory's business readiness deterministically from the seven dimensions above (registration, workers, workflow, runtime, integration, governance, operational): `certified`, `partially_certified`, `failed`, `missing`, `blocked`, or `deferred`. A factory only reaches `certified` when every dimension is `Passed` — an incomplete workflow or a missing integration is never certified.
10. Produce a machine-readable Business Factory Audit Report (`BFART-RPT-v1` / `BFART-001-v1`) documenting every factory assessment, workflow/runtime/integration/governance summaries, outstanding issues, and confidence score, plus `consumableByQ1105` and the `Q1105ConsumableContract` exposed for Q11-05.
11. Submit findings through the Executive Reporting Runtime and preserve complete, immutable audit history.

## Business Factory Assessment model

Each row of the `assessments` matrix records: `factoryId`, `factoryName`, `registrationStatus`, `workerStatus`, `workflowStatus`, `runtimeStatus`, `integrationStatus`, `governanceStatus`, `operationalStatus`, `readinessClassification`, `supportingEvidence`, `auditReference`, `auditTimestamp`.

## Integrations

The worker integrates with:

- Pillow Command Audit (Q11-03) — consumes `getQ1104ConsumableContract()`
- Production Certification Core (Q11-01)
- Shared Runtime Core — `listFactories()` (sole authoritative factory discovery source)
- Worker Registry — `listWorkers()` (worker coverage + workforce factory registration)
- Empire Builder / Commerce / Media / Digital Products / Enterprise Platform / Local Business / Affiliate / Capital Factory Core — dedicated registration handles (optional to bind; absence yields `Partial`/`Missing` evidence, never fabricated)
- Pillow Orchestration Runtime — `invokeWorker` presence (workflow dispatch)
- Monitoring Runtime — external integration signal
- Audit Runtime — external integration signal
- Executive Reporting Runtime — `submitWorkerReport`

## Boundaries

The Business Factory Audit:

- **does** discover every business factory strictly from the injected Shared Runtime Core
- **does** verify registration, workers, workflows, runtime integration, external integrations, governance, and operational readiness from observed evidence only
- **does** classify business factory readiness deterministically and calculate an overall confidence score
- **does** expose a `Q1105ConsumableContract` for Q11-05 (Security Audit) to consume
- **does** consume the `Q1104ConsumableContract` exposed by Q11-03 (Pillow Command Audit) when injected
- does **not** fabricate audit evidence
- does **not** certify incomplete workflows
- does **not** certify missing integrations
- does **not** assume implementation
- does **not** modify factory implementations
- does **not** repair failed factories
- does **not** bypass Pillow governance
- does **not** bypass Grand King approval
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** implement Q11-05 (Security Audit) or later

## Stop Boundary

Q11-04 is the fourth acceptance gate of the Production Certification series. Q11-05 (Security Audit) is explicitly out of scope; Business Factory Audit only exposes the `Q1105ConsumableContract` for that future mission to consume.

## Distinctness

Business Factory Audit (`pillow/src/business-factory-audit/`, BFART, Q11-04) is distinct from:

- Pillow Command Audit (`pillow/src/pillow-command-audit/`, PCART, Q11-03), which certifies whether Pillow can command each registered worker (assignment, dispatch, communication, supervision, progress, result collection) — Business Factory Audit consumes its `Q1104ConsumableContract` but focuses exclusively on business factory readiness (registration, workers, workflow, runtime, integration, governance, operational).
- Pillow Orchestration Runtime (`pillow/src/pillow-orchestration-runtime/`, POR), which actually dispatches and executes worker/tool/workflow invocations — Business Factory Audit only probes `invokeWorker` presence structurally and never invokes it.
- Shared Runtime Core (`pillow/src/shared-runtime-core/`, SRTC), which registers and operates the factory topology — Business Factory Audit only reads factory discovery from it and never modifies factory implementations.
- Production Certification Core (`pillow/src/production-certification-core/`, PCCRT, Q11-01), which certifies overall production readiness (programmes, factories, runtimes) — Business Factory Audit focuses exclusively on per-factory business readiness.

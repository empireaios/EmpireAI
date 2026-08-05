# Q11-04 Business Factory Audit — Validation Checklist

## Locked naming

- [x] Folder: `pillow/src/business-factory-audit/`
- [x] Class: `BusinessFactoryAudit`
- [x] Engine: `PILLOW-BFART-001`
- [x] Codes: `BFART-001-v1`, `BFART-RPT-v1`, `Q11-BFART-v1`
- [x] Mission: `Q11-04`
- [x] Session variable: `businessFactoryAudit`
- [x] Consumes `pillowCommandAudit.getQ1104ConsumableContract()` (`consumerMissionId: "Q11-04"`)
- [x] Emits `getQ1105ConsumableContract()` for Q11-05 (Security Audit)
- [x] `neverImplementQ1105OrLater: true` (configuration + report + cockpit + Q1105 contract)
- [x] Governance doc: `docs/governance/EMPIREAI_BUSINESS_FACTORY_AUDIT_SYSTEM.md`
- [x] Cert pack: `docs/audits/pillow/q11-04-business-factory-audit/`

## Domain behaviour

- [x] Discovers factories strictly from injected `sharedRuntimeCore` (`listFactories()` / `getCatalog()` / `getTopology()`) — never invents factories
- [x] Cross-references `FACTORY_KEYS` (`workforce-os`, `workforce`, `empire-builder-factory`, `commerce-factory`, `media-factory`, `digital-products-factory`, `enterprise-platform-factory`, `local-business-factory`, `affiliate-factory`, `capital-factory`) as read-only evidence only
- [x] `BusinessFactoryAssessment` fields match the locked set exactly: `factoryId`, `factoryName`, `registrationStatus`, `workerStatus`, `workflowStatus`, `runtimeStatus`, `integrationStatus`, `governanceStatus`, `operationalStatus`, `readinessClassification`, `supportingEvidence`, `auditReference`, `auditTimestamp`
- [x] Classifications: `certified | partially_certified | failed | missing | blocked | deferred`
- [x] Decisions: `certify | withhold | escalate | defer`
- [x] `BusinessFactoryAuditReport` fields match the locked set: `reportId`, `timestamp`, `auditVersion`, `totalBusinessFactories`, `certifiedFactories`, `partiallyCertifiedFactories`, `failedFactories`, `missingFactories`, `blockedFactories`, `deferredFactories`, `workflowSummary`, `runtimeSummary`, `integrationSummary`, `governanceSummary`, `supportingEvidence`, `outstandingIssues`, `confidenceScore`, `metadataVersion`, plus standard fields (`engineId`, `missionId`, `auditStatus`, `findings`, `assessments[]`, `decision`, `neverImplementQ1105OrLater`, etc.)
- [x] Verification methods present: `discoverFactories`, `verifyRegistration`, `verifyWorkers`, `verifyWorkflows`, `verifyRuntimeIntegration`, `verifyExternalIntegrations`, `verifyGovernance`, `verifyOperationalReadiness`, `classifyBusinessFactoryReadiness`, `produceBusinessFactoryAuditReport`/`auditBusinessFactories`, `getQ1105ConsumableContract`, `submitReport`
- [x] Evidence discipline: never fabricates, never certifies incomplete workflows, never certifies missing integrations, presence-based structural checks only, immutable audit history
- [x] Integrations bind: `pillowCommandAudit`, `productionCertificationCore`, `sharedRuntimeCore`, `workerRegistry`, all 8 dedicated `*FactoryCore` handles, `pillowOrchestrationRuntime`, `monitoringRuntime`, `auditRuntime`, `executiveReportingRuntime`; dedicated factory cores optional (`null` ok), `sharedRuntimeCore` + `pillowCommandAudit` required for a full audit
- [x] Factory → core mapping honoured exactly as specified (8 dedicated mappings + workforce fallback)
- [x] Classification logic deterministic and evidence-only

## Module files (18)

- [x] `engine.ts`
- [x] `index.ts`
- [x] `paths.ts`
- [x] `types.ts`
- [x] `configuration.ts`
- [x] `business-factory-audit-controller.ts`
- [x] `business-factory-audit-manager.ts`
- [x] `integrations.ts`
- [x] `mission-guard.ts`
- [x] `evidence-collector.ts`
- [x] `factory-classifier.ts`
- [x] `factory-evaluator.ts`
- [x] `factory-gates.ts`
- [x] `factory-discovery.ts`
- [x] `integration-verifier.ts`
- [x] `audit-store.ts`
- [x] `audit-validator.ts`
- [x] `report-builder.ts`
- [x] `bfart-logging.ts`

## Unit tests

- [x] `pillow/src/validation/tests/business-factory-audit.test.ts` — 12 tests: init, discover factories, verify registration/workers/workflows/runtime/external-integrations/governance/operational-readiness, classify, produce report, Q1105 contract, reject boundary violations, reject Q11-05+ missionId, cockpit + regression
- [x] 12/12 pass
- [x] Regression: `pillow-command-audit.test.ts` 12/12 pass (24/24 combined)

## Wiring

- [x] `pillow/src/session.ts` — import, variable, bundle field, init/bind after `pillowCommandAudit`, orchestrator bundle entry, session return entry, `requireBusinessFactoryAudit()`
- [x] `pillow/src/index.ts` — export block
- [x] `pillow/src/orchestrator/types.ts` — `"business-factory-audit"` added to `SubsystemId`
- [x] `pillow/src/orchestrator/subsystem-registry.ts` — bundle field + health-probe descriptor
- [x] `backend/src/orchestration/pillow-host/business-factory-audit-bridge.ts` — offline snapshot
- [x] `backend/src/orchestration/pillow-host/pillow-host.ts` — 18 `BusinessFactoryAudit*` methods
- [x] `backend/src/orchestration/pillow-host/routes/pillow-routes.ts` — `/api/pillow/business-factory-audit/*` routes

## Critical constraints

- [x] Q11-05 not implemented (only `Q1105ConsumableContract` exposed, structural-signal-only)
- [x] No factories invented beyond `FACTORY_KEYS` / discovered `sharedRuntimeCore` factories
- [x] No factory implementations modified
- [x] No placeholders/TODOs
- [x] All existing code preserved; only additive changes
- [x] Matches PCART code quality and evidence discipline (verified via side-by-side structural review + passing regression suite)

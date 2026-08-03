# EmpireAI Architecture Worker

PILLOW-ARW-001 / Q6-03 provides the Architecture Worker.

The Architecture Worker transforms approved Requirements Reports into production-ready technical architecture (modules, APIs, services, data flows, deployment topology, integrations). It produces machine-readable Architecture Reports with architecture clearly traceable to approved requirements and assumptions distinguished from architectural decisions. It **does** receive approved requirements reports, design system architecture, define modules, design APIs, design service boundaries, design data flows, design deployment topology, identify dependencies, and evaluate scalability/security/maintainability. It does **not** write frontend code, write backend code, deploy applications, implement application logic, override Pillow or Grand King, or implement Q6-04 or later.

> Note: Doctrine ID is **PILLOW-ARW-001**. Metadata version `ARW-001-v1`. Report version `ARW-RPT-v1`. Worker ID: `wkr-architecture-01`. Module ID: `architecture-worker`. Factory: `enterprise-platform-factory`. Role: `role-architect-architecture`. Architecture IDs: `arw-arch-*`. Platform IDs: `arw-plt-*`. Module IDs: `arw-mod-*`. API IDs: `arw-api-*`. Service IDs: `arw-svc-*`. Deployment IDs: `arw-dep-*`. Decision IDs: `arw-dec-*`. Validation IDs: `arw-val-*`. Engine IDs: `arw-eng-*`. Run IDs: `arw-run-*`. Executive report IDs: `ert-arw-*`.

## Boundaries

The Architecture Worker:

- **does** receive approved requirements reports; design overall system architecture; define application modules; design internal and external APIs; design service boundaries; design data flow architecture; design deployment topology; identify architectural dependencies; evaluate scalability, security, and maintainability; and produce machine-readable Architecture Reports
- does **not** write frontend code
- does **not** write backend code
- does **not** deploy applications
- does **not** implement application logic
- does **not** implement Q6-04 or later
- does **not** override Pillow or Grand King
- follows approved requirements and preserves complete traceability
- separates architectural decisions from assumptions
- validates architectural consistency
- preserves audit history
- emits structural architecture signals only — never frontend/backend code, application logic, or deployment

## Architecture Report

Each report includes: Architecture ID (`arw-arch-*`), Timestamp, Platform ID (`arw-plt-*`), Platform Name, System Overview, Module Architecture (moduleId, name, responsibility, dependencies), API Architecture (apiId, name, protocol, endpoints, direction), Data Flow (flowId, from, to, description, dataType), Service Dependencies (dependencyId, fromService, toService, kind), Deployment Architecture (topology, environments, components), Integration Architecture (integrationId, system, pattern, notes), Security Considerations, Scalability Considerations, Maintainability Considerations, Confidence Score, and Metadata version (`ARW-001-v1`).

Orchestration extras include requirementsReportId, factoryMissionId, businessId, businessObjective, architecturalDecisions, assumptions, supportedArchitectureDomains, architectureSteps, selfReviewPassed, selfReviewFindings, qualityReview, complianceReview, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported architecture domains

Architecture domains (extensible): `system_architecture`, `module_design`, `api_design`, `service_architecture`, `database_interaction`, `event_flow`, `deployment_topology`, `external_integrations`, `unknown`. Default domain: `system_architecture`.

## Prerequisites

- Q6-01 Enterprise Platform Factory Core (`PILLOW-EPFC-001`)
- Q6-02 Requirements Worker (`PILLOW-RQW-001`)

## Safety

Architecture is never fabricated beyond approved requirements. When requirements are thin, structural architecture is tied to provided requirements and assumptions are listed separately — no invented infrastructure or business facts. Architecture Reports are submitted through the Executive Reporting Runtime with missionId `Q6-03`. Architecture is structural signal only — never frontend/backend code, application logic, or deployment.

# EmpireAI Requirements Worker

PILLOW-RQW-001 / Q6-02 provides the Requirements Worker.

The Requirements Worker transforms approved business intent into structured implementation-ready software requirements (functional/NFR, user stories, use cases, acceptance criteria, assumptions/risks/constraints). It produces machine-readable Requirements Reports with requirements clearly traceable to approved intent and assumptions distinguished from requirements. It **does** receive approved business intent, identify stakeholders, define objectives, and produce requirements artifacts. It does **not** design architecture, write application code, deploy software, invent unsupported business requirements, override Pillow or Grand King, or implement Q6-03 or later.

> Note: Doctrine ID is **PILLOW-RQW-001**. Metadata version `RQW-001-v1`. Report version `RQW-RPT-v1`. Worker ID: `wkr-requirements-01`. Module ID: `requirements-worker`. Factory: `enterprise-platform-factory`. Role: `role-analyst-requirements`. Requirements IDs: `rqw-req-*`. Platform IDs: `rqw-plt-*`. Story IDs: `rqw-story-*`. Use case IDs: `rqw-uc-*`. Acceptance criteria IDs: `rqw-ac-*`. Functional requirement IDs: `rqw-fr-*`. Non-functional requirement IDs: `rqw-nfr-*`. Decision IDs: `rqw-dec-*`. Validation IDs: `rqw-val-*`. Engine IDs: `rqw-eng-*`. Run IDs: `rqw-run-*`. Executive report IDs: `ert-rqw-*`.

## Boundaries

The Requirements Worker:

- **does** receive approved business intent; identify stakeholders; define business objectives; produce functional and non-functional requirements; generate user stories, use cases, and acceptance criteria; identify assumptions, risks, and constraints; and produce machine-readable Requirements Reports
- does **not** design architecture
- does **not** write application code
- does **not** deploy software
- does **not** invent unsupported business requirements — when intent is thin, structural requirements tie to provided intent and assumptions are marked separately
- does **not** implement Q6-03 or later
- does **not** override Pillow or Grand King
- follows approved business intent and preserves complete traceability
- distinguishes requirements from assumptions
- validates completeness before submission
- preserves audit history
- emits structural requirements signals only — never architecture, code, or deployment

## Requirements Report

Each report includes: Requirements ID (`rqw-req-*`), Timestamp, Platform ID (`rqw-plt-*`), Platform Name, Business Objective, Stakeholders, Functional Requirements (id, statement, priority, category), Non-Functional Requirements (id, statement, category), User Stories (id, asA, iWant, soThat, priority), Use Cases (id, title, actors, preconditions, mainFlow, postconditions), Acceptance Criteria (id, storyId, criterion, measurable), Assumptions, Constraints, Technical Constraints, Regulatory Constraints, Risks, Business Rules, Confidence Score, and Metadata version (`RQW-001-v1`).

Orchestration extras include businessId, factoryMissionId, approvedBusinessIntent, intentApproved, requirementType, supportedRequirementTypes, requirementsSteps, selfReviewPassed, selfReviewFindings, qualityReview, complianceReview, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported requirement types

Requirement types (extensible): `functional_requirements`, `non_functional_requirements`, `business_rules`, `user_stories`, `use_cases`, `acceptance_criteria`, `technical_constraints`, `regulatory_constraints`, `unknown`. Default type: `functional_requirements`.

## Prerequisites

- Q6-01 Enterprise Platform Factory Core (`PILLOW-EPFC-001`)

## Safety

Requirements are never fabricated beyond approved business intent. When intent is thin, structural requirements are tied to provided intent and assumptions are listed separately — no invented market or business facts. Requirements Reports are submitted through the Executive Reporting Runtime with missionId `Q6-02`. Requirements are structural signal only — never architecture design, application code, or deployment.

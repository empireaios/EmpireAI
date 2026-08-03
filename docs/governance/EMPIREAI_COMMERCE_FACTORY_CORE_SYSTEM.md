# EmpireAI Commerce Factory Core

PILLOW-CMF-001 / Q3-01 provides the Commerce Factory Core.

The Commerce Factory Core receives an approved Business Blueprint and Business Approval Pack, verifies Grand King approval / blueprint completeness / implementation prerequisites, and creates a machine-readable **Commerce Build Mission** for later Q3 workers.

It is **preparation only**. It does not build stores, import products, configure marketplaces, or execute commerce implementation.

> Note: Doctrine ID is **PILLOW-CMF-001** (not CFC — that ID belongs to Company Factory Certified). Metadata version `CMF-001-v1`. Mission version `CMF-CBM-v1`. Public alias: `CmfCommerceBuildMission`.

## Boundaries

The Commerce Factory Core:

- **does** receive approved blueprints and approval packs, verify readiness, classify commerce category, create Commerce Build Missions, register with Mission Coordination, and submit via Executive Reporting Runtime
- does **not** build stores
- does **not** import products
- does **not** configure marketplaces
- does **not** execute commerce implementation
- does **not** implement Q3-02 or later
- does **not** override Pillow or Grand King

## Commerce Build Mission record

Each record includes: Commerce Build Mission ID, Timestamp, Business Blueprint ID, Business Approval Pack ID, Business Type, Commerce Category, Mission Objective, Current Status, Required Next Step, Approval Status, Grand King / completeness / prerequisites verification flags, Missing Prerequisites, Traceability Reference, and Metadata version (`CMF-001-v1`).

## Commerce categories

Default: online_store, marketplace, dropshipping, subscription_commerce, wholesale, hybrid_commerce, unknown.

Additional categories can be registered through configuration without redesign.

## Prerequisites

- Q2 Empire Builder Certification (`PILLOW-EBC-001` / Q2-10)
- Approved Business Blueprint (Q2-06) and Business Approval Pack (Q2-09) with Proceed recommendation and Grand King approval

## Safety

Credentials and authentication tokens are never exposed. Mission creation preserves auditability and end-to-end traceability from Q2 artifacts. Sensitive values are masked in logs.

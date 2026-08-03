# EmpireAI Affiliate Certification

PILLOW-AFCRT-001 / Q8-09 provides the Affiliate Certification inside the Affiliate Factory. It is the final Q8 acceptance gate.

The Affiliate Certification **audits and certifies** the readiness of the complete Affiliate Factory pipeline — Q8-01 (Affiliate Factory Core), Q8-02 (Affiliate Opportunity Worker), Q8-03 (Comparison Site Worker), Q8-04 (Review Content Worker), Q8-05 (SEO Content Worker), Q8-06 (Email Funnel Worker), Q8-07 (Analytics Worker), and Q8-08 (Affiliate Compliance Worker). It collects repository evidence (module presence, `CERTIFICATION_EVIDENCE.json` FINAL PASS status, `session.ts` bindings, subsystem registry references, config and governance documents) and optional runtime probes of injected worker handles, classifies each component's status, verifies integration wiring, evaluates production/governance/operational/workflow readiness, and produces a fail-closed certification decision.

The Affiliate Certification reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It preserves complete traceability and certification audit history back to the underlying Q8-01..Q8-08 evidence. It is the final acceptance gate of the Q8 series — it never implements Q9-01 or later.

## Workflow

1. Collect repository evidence for every Q8-01..Q8-08 mission: module directory presence, `CERTIFICATION_EVIDENCE.json` (or `.md`) FINAL PASS status, `session.ts` dependency references, subsystem registry references, config file presence, and governance document presence. Evidence absent from the repository is always recorded honestly — never fabricated.
2. Probe injected worker dependencies read-only (`getState`, `diagnostics`, `getCockpitSnapshot`, or `getReports`, in that order) to determine runtime reachability. Absence of an injected handle is always reported as not reachable — never assumed reachable.
3. Classify every Q8-01..Q8-08 component as **Completed**, **Partially Implemented**, **Missing**, **Broken / Deviating**, or **Intentionally Deferred**, strictly from observed evidence and probe results.
4. Verify integration wiring among Q8 workers from `session.ts` bind blocks cross-checked against each mission's own recorded wiring evidence.
5. Evaluate production readiness, governance compliance, operational readiness, workflow completeness, and reporting capability — every dimension derived from observed evidence only.
6. Apply the fail-closed certification gate to produce one of: **Certified**, **Conditionally_Certified**, **Not_Certified**, **Failed**, or **Deferred**.
7. Produce a machine-readable Affiliate Certification Report (`AFCRT-RPT-v1` / `AFCRT-001-v1`) documenting every finding, risk, and outstanding item.
8. Submit findings through the Executive Reporting Runtime and preserve complete certification audit history.

## Integrations

The worker integrates with:

- Affiliate Factory Core (Q8-01)
- Affiliate Opportunity Worker (Q8-02)
- Comparison Site Worker (Q8-03)
- Review Content Worker (Q8-04)
- SEO Content Worker (Q8-05)
- Email Funnel Worker (Q8-06)
- Analytics Worker (Q8-07)
- Affiliate Compliance Worker (Q8-08)
- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Worker Recovery System
- Audit Runtime (optional)

## Boundaries

The Affiliate Certification:

- **does** audit and certify the Affiliate Factory (Q8-01..Q8-08) from observed repository and runtime evidence
- does **not** fabricate verification results
- does **not** certify unsupported functionality
- does **not** implement missing functionality
- does **not** auto-correct failed implementations
- does **not** override governance
- does **not** override approved architecture
- does **not** override Pillow
- does **not** override Grand King
- does **not** bypass Grand King approval
- does **not** implement Q9-01 or later

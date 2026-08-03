# EmpireAI Capital Factory Core

PILLOW-CAPFC-001 / Q9-01 provides the Capital Factory Core inside the Capital Factory.

The Capital Factory Core is the central orchestration layer responsible for protecting, managing, growing, and allocating EmpireAI capital across business factories. It coordinates Capital Factory workers, maintains enterprise capital state, tracks capital allocation status, monitors financial readiness, and provides Pillow with a unified executive financial view through machine-readable Capital Factory Reports consumable by Q9-02 Accounting Worker.

The Capital Factory Core reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never performs accounting, never forecasts finances, never executes investments automatically, and never fabricates financial or worker status.

## Workflow

1. Create and register Capital Projects in the enterprise capital registry.
2. Maintain enterprise capital state and financial metadata for multiple businesses.
3. Coordinate Capital Factory worker role slots (structural placeholders for Q9-02+).
4. Manage capital project lifecycle (registered → coordinated → preparation → readiness → operating).
5. Track financial readiness and capital allocation status from observed orchestration signals only.
6. Produce executive financial summaries for Pillow and Grand King.
7. Produce Capital Factory Reports (`CAPFC-RPT-v1` / `CAPFC-001-v1`) with `consumableByQ902: true`.
8. Submit findings through the Executive Reporting Runtime and preserve audit history.

## Integrations

- Worker Registry
- Worker Lifecycle
- Executive Reporting Runtime
- Audit Runtime
- Mission Runtime
- Queue Runtime
- Shared Runtime services (memory)
- Worker Recovery System

## Boundaries

The Capital Factory Core:

- DOES coordinate Capital Factory workers and capital project lifecycle.
- DOES monitor financial readiness and produce Capital Factory Reports.
- DOES NOT perform accounting.
- DOES NOT forecast finances.
- DOES NOT execute investments automatically.
- DOES NOT override approved architecture, Pillow, or Grand King.
- DOES NOT implement Q9-02 or later.

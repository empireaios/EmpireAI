# EmpireAI Shared Runtime Core

PILLOW-SRTC-001 / Q10-01 provides the Shared Runtime Core inside Pillow.

The Shared Runtime Core is foundational orchestration infrastructure that registers factories and workers into a unified runtime registry, provides shared execution context, routes requests between factories as routing records only (never executing factory or worker business logic), coordinates runtime lifecycle and health, and produces Shared Runtime Reports consumable by Q10-02 Pillow Orchestration Runtime.

The Shared Runtime Core reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never replaces factory or worker logic, never executes business-specific decisions, and never fabricates runtime state.

## Workflow

1. Connect and bootstrap runtime services (factory registry, worker registry, runtime registry, execution context, service discovery, dependency resolution, runtime metadata, versioning, health, state, diagnostics).
2. Register default factory catalog (Workforce Q0/Q1, Empire Builder Q2, Commerce Q3, Media Q4, Digital Products Q5, Enterprise Platform Q6, Local Business Q7, Affiliate Q8, Capital Q9).
3. Register workers from caller descriptors, optional DI discovery, or seed catalog — never invent healthy state unless probed.
4. Create and propagate shared execution context across registered factories and workers.
5. Record deterministic cross-factory routing (sourceFactory → targetFactory → service) without invoking business logic.
6. Resolve integration dependencies and collect runtime diagnostics from observed evidence only.
7. Produce Shared Runtime Reports (`SRTC-RPT-v1` / `SRTC-001-v1`) with `consumableByQ1002: true`.
8. Expose Q1002ConsumableContract for Q10-02 and preserve complete runtime and audit history.

## Integrations

- Worker Registry
- Executive Reporting Runtime
- Audit Runtime
- Worker Recovery System
- Optional factory core handles (presence only): Empire Builder, Commerce, Media, Digital Products, Enterprise Platform, Local Business, Affiliate, Capital, Workforce OS

## Boundaries

The Shared Runtime Core:

- DOES register factories and workers into a unified runtime registry.
- DOES provide shared execution context and cross-factory routing records.
- DOES coordinate runtime lifecycle, health, and diagnostics.
- DOES produce Shared Runtime Reports for downstream Q10-02 consumption.
- DOES NOT replace factory or worker business logic.
- DOES NOT execute business-specific decisions.
- DOES NOT fabricate runtime health for missing dependencies.
- DOES NOT override approved architecture, Pillow, or Grand King.
- DOES NOT implement Q10-02 or later.

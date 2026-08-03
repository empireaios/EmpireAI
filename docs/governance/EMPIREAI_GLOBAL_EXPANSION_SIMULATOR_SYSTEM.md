# EmpireAI Global Expansion Simulator

**System ID:** PILLOW-GES-001  
**Mission:** X4-17

The Global Expansion Simulator produces structural, traceable projections for country and regional expansion scenarios. It does not connect to, optimize, or execute actions against production systems.

## Mandatory safety controls
- `neverExecuteSimulatedActionsAgainstProductionSystems` is always true.
- Simulation output is structural-signal-only and does not expose credentials, authentication tokens, or sensitive enterprise information.
- Unvalidated simulation intelligence cannot be optimized or executed.
- Every record carries a trace identifier and audit metadata.

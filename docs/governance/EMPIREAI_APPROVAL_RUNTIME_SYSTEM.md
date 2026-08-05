# EmpireAI Approval Runtime

PILLOW-APVRT-001 / Q10-09 provides the Approval Runtime inside Pillow.

The Approval Runtime is the enterprise approval routing and governance service for EmpireAI. It registers approval policies, determines approval requirements, routes requests deterministically to Pillow / Grand King / multi-stage approvers, records explicit approve/reject/escalate/delegate decisions append-only, resumes execution only after full approval, and produces Approval Runtime Reports consumable by Q10-10 Monitoring Runtime.

The Approval Runtime reports to Pillow and operates under the Workforce Constitution, Organization Charter, and Authority Matrix. It never fabricates approval decisions, never auto-approves restricted or Grand King actions, never exposes secrets (auditReference only), and never bypasses Pillow or Grand King governance.

## Approval Types

pillow, grand_king, multi_stage, conditional, delegated, escalated, custom_extension.

## Approval Statuses

pending, routed, awaiting_pillow, awaiting_grand_king, approved, rejected, escalated, delegated, timed_out, resumed, cancelled.

## Policy Scopes

mission, factory, worker, runtime, global, high_risk.

## Seed Policies

- `pol-pillow-standard` — Pillow only
- `pol-grand-king-restricted` — Pillow then Grand King (highRisk)
- `pol-multi-stage-ops` — Pillow → factory_lead → Grand King (highRisk)
- `pol-conditional-escalation` — Pillow with allowEscalation
- `pol-delegated-ops` — Pillow with allowDelegation (Grand King not delegable)

## Workflow

1. Connect and bootstrap approval services (policy registry, requirement engine, approval router, multi-stage/delegation/escalation engines, timeout handler, decision recorder, resume engine, metrics collector, governance summary, report builder).
2. Register or resolve approval policies deterministically by policyId.
3. Determine approval requirements from mission/factory/worker/highRisk/approvalType signals.
4. Submit approval requests; route to current approver/stage.
5. Decide only via explicit approve/reject/escalate/delegate calls — never fabricate decisions.
6. Advance multi-stage only after approve; reject blocks further stages and resume.
7. Resume execution after full approval with a resumeToken; rejection prevents resume.
8. Produce Approval Runtime Reports (`APVRT-RPT-v1` / `APVRT-001-v1`) with `consumableByQ1010: true`.
9. Expose Q1010ConsumableContract for Q10-10 and preserve complete approval and audit history.

## Integrations

- Shared Runtime Core (topology, routing, Q1002 contract)
- Pillow Orchestration Runtime (structural dispatch signals, Q1003 contract)
- Mission Runtime (Q1004 contract consumption)
- Queue Runtime (Q1005 contract consumption)
- Memory Runtime (Q1006 contract consumption)
- API Runtime (Q1007 contract consumption)
- Tool Runtime (Q1008 contract consumption)
- Communication Runtime (Q1009 contract consumption)
- Executive Reporting Runtime
- Audit Runtime
- Worker Registry / Factory Registry
- Worker Recovery System / Recovery

## Boundaries

The Approval Runtime:

- DOES register policies and route caller-submitted approval requests deterministically.
- DOES enforce Pillow and Grand King approval stages without auto-approval shortcuts.
- DOES produce Approval Runtime Reports for downstream Q10-10 consumption.
- DOES NOT fabricate approval decisions or invent approvals.
- DOES NOT auto-approve restricted or Grand King actions.
- DOES NOT delete approval or decision history.
- DOES NOT expose secrets — auditReference strings only.
- DOES NOT bypass Pillow governance or Grand King approval.
- DOES NOT replace business logic or worker implementations.
- DOES NOT implement Q10-10 Monitoring Runtime or later.

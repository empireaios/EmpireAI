# EmpireAI Empire Capital Allocation System

Doctrine: **PILLOW-ECA-001**  
Mission: **X5-05**

Empire Capital Allocation produces structural capital intelligence, traceable allocation records, and governance-ready recommendations. It does not execute, initiate, or approve a capital transfer.

## Safety invariants

- `neverExecuteCapitalTransfersAutomaticallyWithoutApprovedGovernance` is always true.
- Allocation records and recommendations default `approvedForTransfer` to false.
- Financial signals are structural and sensitive values are masked.
- Credentials, authentication tokens, and sensitive financial information are never exposed or logged.
- Traceability, auditability, and enterprise integrity are preserved.

# EmpireAI Authority Matrix System

PILLOW-AMX-001 / Q1-05 provides the Authority Matrix.

The Authority Matrix is the official decision-governance framework for the AI Workforce. Every AI Worker must know what it may decide independently, what requires Pillow approval, what requires Grand King approval, and what it must never do.

No worker may exceed its delegated authority. Pillow remains the executive authority. The Grand King remains the supreme authority.

> Note: Doctrine ID is **PILLOW-AMX-001**. There is one authoritative Authority Matrix. Every future worker, department and factory must derive its decision authority from this matrix.

## Boundaries

The Authority Matrix:

- **does** define decision authority, define approval requirements, define escalation paths, and govern workforce autonomy
- does **not** execute worker tasks
- does **not** replace the Approval Router
- does **not** replace the Organization Charter
- does **not** override Pillow
- does **not** override Grand King

## Authority rule definition

Each rule includes: Matrix Version, Authority ID, Decision Category, Worker Role, Permitted Actions, Restricted Actions, Required Approval, Escalation Target, Risk Classification, and Metadata version (`AMX-001-v1`).

## Authority levels

Default: autonomous_worker_decision, manager_approval, department_approval, factory_approval, pillow_approval, grand_king_approval.

Additional authority levels can be registered through configuration without redesign.

## Decision categories

Default: information_retrieval, planning, business_operations, financial_decisions, marketplace_actions, media_publishing, infrastructure_changes, security, data_management, customer_communications, external_integrations.

Additional decision categories can be registered through configuration without redesign.

## Mandatory authority rules

Every authority rule must define who may perform the action, approval required, maximum authority, escalation path, risk level, and audit requirements. No AI Worker may bypass the Authority Matrix.

## Safety

Credentials and authentication tokens are never exposed. Matrix operations preserve auditability and traceability. Sensitive values are masked in logs. Authority records never claim that the matrix executed worker tasks, replaced Approval Router, replaced Organization Charter, overrode Pillow, or overrode Grand King.

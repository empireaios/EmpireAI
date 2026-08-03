# EmpireAI Role Taxonomy System

PILLOW-RTX-001 / Q1-03 provides the Role Taxonomy.

The Role Taxonomy is the authoritative classification system for every AI Worker role within EmpireAI. Every AI Worker must belong to exactly one defined role category. The taxonomy standardizes responsibilities, authority, collaboration and governance across the entire AI Workforce.

This ensures Pillow understands not only WHO every worker is, but WHAT role they perform inside the organization.

> Note: Doctrine ID is **PILLOW-RTX-001**. There is one authoritative Role Taxonomy. Every future AI Worker must inherit a role from this taxonomy.

## Boundaries

The Role Taxonomy:

- **does** standardize workforce roles, define organizational responsibilities, define authority relationships, and enable consistent workforce management
- does **not** execute worker tasks
- does **not** replace the Organization Charter
- does **not** replace Worker Constitution
- does **not** override Pillow
- does **not** override Grand King

## Role definition

Each role includes: Taxonomy Version, Role ID, Role Name, Role Category, Parent Role, Responsibilities, Authority Level, Reporting Relationship, Collaboration Rules, Escalation Rules, Governance Rules, and Metadata version (`RTX-001-v1`).

## Mandatory role categories

Default: executive, director, manager, lead, specialist, reviewer, analyst, coordinator, support, system.

Additional role categories can be registered through configuration without redesigning the taxonomy.

## Mandatory role rules

Every role must define purpose, responsibilities, decision authority, escalation authority, reporting structure, required skills, required quality standard, and required governance rules.

## Safety

Credentials and authentication tokens are never exposed. Taxonomy operations preserve auditability and traceability. Sensitive values are masked in logs. Role records never claim that the taxonomy executed worker tasks, replaced Organization Charter, replaced Worker Constitution, overrode Pillow, or overrode Grand King.

# EmpireAI Skill Taxonomy System

PILLOW-STX-001 / Q1-04 provides the Skill Taxonomy.

The Skill Taxonomy is the official capability framework for the entire AI Workforce. Every AI Worker must possess one or more defined skills. Every task, mission and business capability must map back to standardized skills.

This ensures Pillow understands not only WHO every worker is, but WHAT that worker is capable of doing and to what level of proficiency.

> Note: Doctrine ID is **PILLOW-STX-001**. There is one authoritative Skill Taxonomy. Every future AI Worker must derive its capabilities from this taxonomy.

## Boundaries

The Skill Taxonomy:

- **does** standardize workforce skills, define capability requirements, define proficiency levels, and enable skill-based worker assignment
- does **not** execute worker tasks
- does **not** replace the Role Taxonomy
- does **not** replace the Workforce Capability Registry
- does **not** override Pillow
- does **not** override Grand King

## Skill definition

Each skill includes: Taxonomy Version, Skill ID, Skill Name, Skill Category, Parent Skill, Description, Proficiency Level, Required Tools, Capability Limits, Validation Rules, Certification Requirements, and Metadata version (`STX-001-v1`).

## Minimum skill categories

Default: executive, business, commerce, media, engineering, finance, operations, marketing, research, customer_support, analytics, security.

Additional skill categories can be registered through configuration without redesigning the taxonomy.

## Proficiency levels

Default: beginner, intermediate, advanced, expert, master.

Additional proficiency levels can be registered through configuration without redesign.

## Mandatory skill rules

Every skill must define purpose, required knowledge, required tools, validation method, dependencies, capability limits, and certification requirements. Every AI Worker must inherit skills only from this taxonomy.

## Safety

Credentials and authentication tokens are never exposed. Taxonomy operations preserve auditability and traceability. Sensitive values are masked in logs. Skill records never claim that the taxonomy executed worker tasks, replaced Role Taxonomy, replaced Workforce Capability Registry, overrode Pillow, or overrode Grand King.

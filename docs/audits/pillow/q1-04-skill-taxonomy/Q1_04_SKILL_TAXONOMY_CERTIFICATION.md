# Q1-04 Skill Taxonomy

**Status:** FINAL PASS  
**Doctrine:** PILLOW-STX-001  
**Programme:** Q1 — Workforce Factory Foundation  
**Mission:** Q1-04 Skill Taxonomy  
**Primary Deliverable:** Define skills, proficiency levels, required tools, capability limits and validation standards.

> Doctrine ID uses **PILLOW-STX-001**. Skill Taxonomy defines and derives only; it never executes worker tasks, replaces Role Taxonomy, replaces Workforce Capability Registry, overrides Pillow, or overrides Grand King.

## How Q1-04 works

1. The authoritative Skill Taxonomy is defined (`STX-TAX-v1`).
2. Skills are registered across mandatory categories with hierarchy and proficiency.
3. Skills declare purpose, knowledge, tools, validation, dependencies, limits and certification.
4. Workers derive one or more skills from the taxonomy with validated parent chains.
5. Machine-readable skill definitions are produced (`STX-001-v1`).

## Prerequisites

- Q0 Unified Workforce Certification (`PILLOW-UWC-001` / Q0-30)
- Q1-01 Worker Constitution (`PILLOW-WCT-001`)
- Q1-02 Organization Charter (`PILLOW-OCH-001`)
- Q1-03 Role Taxonomy (`PILLOW-RTX-001`)

## Mandatory skill categories

`executive`, `business`, `commerce`, `media`, `engineering`, `finance`, `operations`, `marketing`, `research`, `customer_support`, `analytics`, `security`

## Proficiency levels

`beginner`, `intermediate`, `advanced`, `expert`, `master`

## Mandatory skill rules

`exactly_one_skill_category`, `purpose_defined`, `required_knowledge_defined`, `required_tools_defined`, `validation_method_defined`, `dependencies_defined`, `capability_limits_defined`, `certification_requirements_defined`, `proficiency_level_valid`, `inherits_from_valid_parent`

## Verification

`npx --yes tsx --test "src/validation/tests/skill-taxonomy.test.ts"` — 10 passing, 0 failing.

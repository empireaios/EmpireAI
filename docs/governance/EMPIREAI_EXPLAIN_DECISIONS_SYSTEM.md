# EmpireAI Explain Decisions System

**Mission ID:** T4-06  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-ED-001

## Constitutional Purpose

Implement Explain Decisions for Pillow. This mission consumes the Multi-Proposal Generator from T4-04 and Side-by-Side Comparison from T4-05, enabling Pillow to explain the design rationale behind UX proposals, comparisons, and recommended choices.

## Scope (T4-06 Only)

Transparent design rationale · proposal explanations · comparison explanations · UX benefits · tradeoffs · evidence linkage · accessibility/consistency/workflow/executive preference rationale.

**Out of scope:** Approval workflow · preference learning · continuous collaboration · autonomous UX evolution · automatic UX changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Explain Decisions (T4-06 / PILLOW-ED-001)                  │
├─────────────────────────────────────────────────────────────┤
│  Explain Decisions Manager                                  │
│  Design Rationale Engine                                    │
│  Proposal / Comparison Rationale Generators                 │
│  UX Evidence Linker · Tradeoff Analyzer                     │
│  Accessibility / Consistency / Workflow / Executive         │
│  Preference Rationale Generators                            │
│  Explanation Metadata Generator · Explanation Validator     │
│  Health Monitor · Recovery Manager                          │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-04 Multi-Proposal Generator
         │ T4-05 Side-by-Side Comparison
         │ T2-08 UX Scoring · T2-09 Recommendations
         │ T3-05 Preview · T3-06 Validation
```

## Safety

- **Grand King control preserved** — explanations inform decisions; they do not apply or approve changes.
- **No file modification** — explain only.
- **Weak evidence disclosed** — missing or partial evidence is flagged, not hidden.
- **No false certainty** — confidence scores reflect evidence strength.

## Explanation Types

Proposal rationale · comparison rationale · layout · component · navigation · workflow · theme · accessibility · visual consistency · executive preference · UX score · tradeoff explanation.

## Configuration

Externalized via `config/explain-decisions.config.json` and environment variables (`EXPLAIN_DECISIONS_*`).

## Traceability

Each explanation record links to source proposal IDs, comparison IDs, UX findings, scores, recommendations, and evidence references for downstream decision workflows.

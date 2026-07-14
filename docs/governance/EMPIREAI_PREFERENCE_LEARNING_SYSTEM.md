# EmpireAI Preference Learning System

**Mission ID:** T4-08  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-PL-001

## Constitutional Purpose

Implement Preference Learning for Pillow. This mission consumes the Approval Workflow from T4-07 and enables Pillow to continuously learn the Grand King's collaboration preferences from explicit approvals, rejections, and collaboration history.

**Primary deliverable:** Learn Grand King's collaboration preferences  
**Completion outcome:** Smarter collaboration

## Scope (T4-08 Only)

Collaboration preference learning · explicit evidence only · versioned preference records · health monitoring · automatic recovery.

**Out of scope:** Continuous collaboration · autonomous UX evolution · Executive Collaboration certification · automatic approval · automatic UX execution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Preference Learning (T4-08 / PILLOW-PL-001)                 │
├─────────────────────────────────────────────────────────────┤
│  Preference Learning Manager · Collaboration Preference Engine│
│  Approval Learning Engine · Conversation Learning Engine     │
│  Proposal Preference Analyzer · Explanation Preference Analyzer│
│  Collaboration Pattern Analyzer                              │
│  Preference Version Manager · Preference Metadata Generator  │
│  Preference Validator · Health Monitor · Recovery Manager    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-01 Natural UX Conversation
         │ T4-02 Voice UX Commands
         │ T4-03 Screen Annotation
         │ T4-04 Multi-Proposal Generator
         │ T4-05 Side-by-Side Comparison
         │ T4-06 Explain Decisions
         │ T4-07 Approval Workflow
```

## Safety

- **Learn only from explicit Grand King behavior** — approvals, rejections, conversation turns, voice commands, annotations.
- **Never override explicit future instructions** — learned preferences inform suggestions only.
- **Never approve or execute UX changes automatically** — learning is advisory.
- **Grand King control preserved** at all times.
- **Full traceability** — every preference links to source evidence IDs.
- **No sensitive raw values** in logs or exported records.

## Preference Categories

Proposal presentation · explanation presentation · review workflow · approval workflow · comparison preference · annotation preference · conversation preference · voice interaction preference · UX discussion preference · collaboration style · decision style · review sequence · information density · preferred visualization.

## Configuration

Externalized via `config/preference-learning.config.json` and environment variables (`PREFERENCE_LEARNING_*`).

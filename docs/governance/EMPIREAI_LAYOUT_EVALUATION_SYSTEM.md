# EmpireAI Layout Evaluation System

**Mission ID:** T2-04  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-LEV-001

## Constitutional Purpose

Implement Layout Evaluation for Pillow. This mission consumes Executive Style Learning from T2-03 and enables Pillow to automatically evaluate EmpireAI layouts against the certified Visual Foundation, UX Rule Engine, Design System Intelligence, and the Grand King's learned design preferences.

## Scope (T2-04 Only)

Automatic layout evaluation · strength and weakness detection · UX rule violation detection · design system deviation detection · executive preference deviation detection · machine-readable evaluation reports · health monitoring · automatic recovery.

**Out of scope:** Workflow optimization · accessibility intelligence · visual consistency engine · UX scoring · recommendation generation · autonomous frontend building · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layout Evaluation (T2-04 / PILLOW-LEV-001)                   │
├─────────────────────────────────────────────────────────────┤
│  Evaluation Controller → Layout Evaluation Manager            │
│       ↓                              ↓                      │
│  Layout Analysis Engine        Structure/Alignment/Spacing    │
│       ↓                        Hierarchy/Balance/Navigation  │
│  UX Rule Validation Engine     Design System Validation       │
│  Executive Preference Validation Engine                       │
│       ↓                              ↓                      │
│  Evaluation Report Generator   Evaluation Validator           │
│       ↓                              ↓                      │
│  Health Monitor                Recovery Manager             │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Layout (T1-04) · Components (T1-03) · Navigation (T1-05)
         │ UX Rules (T2-01) · Design System (T2-02) · Exec Style (T2-03)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LAYOUT_EVALUATION_ENABLED` | `true` | Enable/disable layout evaluation |
| `LAYOUT_EVALUATION_CONFIDENCE_THRESHOLD` | `0.4` | Minimum confidence for findings |
| `LAYOUT_EVALUATION_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `LAYOUT_EVALUATION_TIMEOUT_MS` | `60000` | Evaluation timeout |
| `LAYOUT_EVALUATION_LOG_LEVEL` | `info` | Logging level |
| `LAYOUT_EVALUATION_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/layout-evaluation` | Evaluation state + latest report |
| POST | `/api/pillow/layout-evaluation/evaluate` | Run layout evaluation |

## Completion Outcome

Automated UX review — Pillow detects layout weaknesses and produces machine-readable evaluation reports.

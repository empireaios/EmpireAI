# EmpireAI UX Scoring System

**Mission ID:** T2-08  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-UXS-001

## Constitutional Purpose

Implement the UX Scoring Engine for Pillow. This mission consumes Visual Consistency from T2-07 and all prior T2 UX intelligence outputs, converting findings into measurable UX quality scores for the EmpireAI interface.

## Scope (T2-08 Only)

UX quality scoring · screen/component/layout/workflow/accessibility/consistency/executive preference scores · weighted category scoring · machine-readable score reports · health monitoring · automatic recovery.

**Out of scope:** Recommendation generation · autonomous frontend building · autonomous redesign · component generation · layout refactoring · theme building · preview generation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  UX Scoring (T2-08 / PILLOW-UXS-001)                         │
├─────────────────────────────────────────────────────────────┤
│  Intelligence Controller → UX Scoring Manager                 │
│       ↓                              ↓                      │
│  Screen / Component / Layout     Workflow / Accessibility     │
│  Consistency / Executive Scoring Engines                    │
│       ↓                              ↓                      │
│  Overall Score Aggregator        Score Report Generator       │
│       ↓                              ↓                      │
│  Score Validator               Health Monitor / Recovery      │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ UX Rules (T2-01) · Design System (T2-02) · Exec Style (T2-03)
         │ Layout Eval (T2-04) · Workflow Opt (T2-05) · Accessibility (T2-06)
         │ Visual Consistency (T2-07)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `UX_SCORING_ENABLED` | `true` | Enable/disable UX scoring |
| `UX_SCORING_PASS_THRESHOLD` | `70` | Minimum pass score |
| `UX_SCORING_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `UX_SCORING_TIMEOUT_MS` | `60000` | Scoring timeout |
| `UX_SCORING_LOG_LEVEL` | `info` | Logging level |
| `UX_SCORING_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/ux-scoring` | Scoring state + latest report |
| POST | `/api/pillow/ux-scoring/score` | Run UX quality scoring |

## Completion Outcome

Measurable UX quality — Pillow calculates comprehensive UX quality scores with machine-readable breakdowns.

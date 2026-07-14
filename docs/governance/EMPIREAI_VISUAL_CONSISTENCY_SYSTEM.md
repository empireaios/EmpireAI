# EmpireAI Visual Consistency System

**Mission ID:** T2-07  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-VCE-001

## Constitutional Purpose

Implement the Visual Consistency Engine for Pillow. This mission consumes Accessibility Intelligence from T2-06 and enables Pillow to check the EmpireAI interface for visual consistency across screens, components, layouts and interaction states.

## Scope (T2-07 Only)

Consistency checking · unified design language validation · component/typography/color/spacing/sizing/icon/layout/navigation/form/pattern consistency · machine-readable findings · health monitoring · automatic recovery.

**Out of scope:** UX scoring engine · recommendation generation · autonomous frontend building · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Visual Consistency (T2-07 / PILLOW-VCE-001)                │
├─────────────────────────────────────────────────────────────┤
│  Intelligence Controller → Visual Consistency Manager       │
│       ↓                              ↓                      │
│  Consistency Checking Engine   Component / Typography       │
│       ↓                        Color / Spacing / Sizing       │
│  Icon / Layout / Navigation    Form / Pattern Checkers      │
│  Consistency Finding Generator Consistency Validator        │
│       ↓                              ↓                      │
│  Health Monitor                Recovery Manager             │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ UI State (T1-02) · Components (T1-03) · Layout (T1-04)
         │ Navigation (T1-05) · Design System (T2-02) · Exec Style (T2-03)
         │ Layout Evaluation (T2-04) · Accessibility (T2-06)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VISUAL_CONSISTENCY_ENABLED` | `true` | Enable/disable visual consistency |
| `VISUAL_CONSISTENCY_CONFIDENCE_THRESHOLD` | `0.4` | Minimum confidence for findings |
| `VISUAL_CONSISTENCY_SPACING_TOLERANCE_PX` | `4` | Spacing token tolerance |
| `VISUAL_CONSISTENCY_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `VISUAL_CONSISTENCY_TIMEOUT_MS` | `60000` | Review timeout |
| `VISUAL_CONSISTENCY_LOG_LEVEL` | `info` | Logging level |
| `VISUAL_CONSISTENCY_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/visual-consistency` | Consistency state + latest report |
| POST | `/api/pillow/visual-consistency/review` | Run consistency review |

## Completion Outcome

Unified design language — Pillow checks EmpireAI visual consistency and produces machine-readable consistency findings.

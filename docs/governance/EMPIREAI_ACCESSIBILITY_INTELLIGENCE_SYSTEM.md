# EmpireAI Accessibility Intelligence System

**Mission ID:** T2-06  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-AII-001

## Constitutional Purpose

Implement Accessibility Intelligence for Pillow. This mission consumes Workflow Optimization from T2-05 and enables Pillow to review the EmpireAI interface for accessibility weaknesses and produce machine-readable accessibility review findings.

## Scope (T2-06 Only)

Accessibility review · inclusive UX analysis · component/layout/navigation/form/modal/table/dashboard accessibility · focus order · keyboard navigation · feedback/loading/empty/error states · machine-readable findings · health monitoring · automatic recovery.

**Out of scope:** Visual consistency engine · UX scoring engine · recommendation generation · autonomous frontend building · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Accessibility Intelligence (T2-06 / PILLOW-AII-001)        │
├─────────────────────────────────────────────────────────────┤
│  Intelligence Controller → Accessibility Intelligence Mgr   │
│       ↓                              ↓                      │
│  Accessibility Review Engine   Component / Layout Evaluators│
│       ↓                        Navigation / Form / Modal     │
│  Table / Dashboard Evaluators  Focus Order / Keyboard Nav   │
│  Feedback State Analyzer       Finding / Metadata Generator │
│       ↓                              ↓                      │
│  Accessibility Validator       Health Monitor / Recovery    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ UI State (T1-02) · Components (T1-03) · Layout (T1-04)
         │ Navigation (T1-05) · Interactions (T1-06) · Context (T1-07)
         │ Workflow Optimization (T2-05)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `ACCESSIBILITY_INTELLIGENCE_ENABLED` | `true` | Enable/disable accessibility intelligence |
| `ACCESSIBILITY_INTELLIGENCE_CONFIDENCE_THRESHOLD` | `0.4` | Minimum confidence for findings |
| `ACCESSIBILITY_INTELLIGENCE_MIN_TOUCH_TARGET_PX` | `44` | Minimum touch target size |
| `ACCESSIBILITY_INTELLIGENCE_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `ACCESSIBILITY_INTELLIGENCE_TIMEOUT_MS` | `60000` | Review timeout |
| `ACCESSIBILITY_INTELLIGENCE_LOG_LEVEL` | `info` | Logging level |
| `ACCESSIBILITY_INTELLIGENCE_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/accessibility-intelligence` | Accessibility state + latest report |
| POST | `/api/pillow/accessibility-intelligence/review` | Run accessibility review |

## Completion Outcome

Inclusive UX — Pillow reviews EmpireAI accessibility, detects weaknesses, identifies strengths, and produces machine-readable accessibility review findings.

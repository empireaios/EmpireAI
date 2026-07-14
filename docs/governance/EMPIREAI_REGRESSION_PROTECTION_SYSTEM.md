# EmpireAI Regression Protection System

**Mission ID:** T3-07  
**Status:** Active · Autonomous Builder  
**Programme:** Autonomous Builder  
**Canonical ID:** PILLOW-RP-001

## Constitutional Purpose

Implement Regression Protection for Pillow. This mission consumes Validation Engine output from T3-06 and upstream T2/T3 records to prevent UX regressions when frontend changes advance.

## Scope (T3-07 Only)

Baseline comparison · UX score regression detection · layout/component/navigation/accessibility/consistency/workflow/responsive/state regressions · blocking regressive changes · machine-readable regression reports.

**Out of scope:** Rollback manager · change documentation · executive collaboration · continuous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Regression Protection (T3-07 / PILLOW-RP-001)               │
├─────────────────────────────────────────────────────────────┤
│  Regression Controller → Regression Protection Manager       │
│       ↓                              ↓                      │
│  Baseline UI State Manager       UX Baseline Comparator      │
│  Layout/Component/Navigation Detectors                     │
│  Accessibility/Consistency/Workflow/Responsive Detectors   │
│       ↓                              ↓                      │
│  Regression Decision Engine      Regression Validator        │
│  Regression Report Generator     Health Monitor              │
│                                  Recovery Manager            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T3-06 Validation · T3-05 Previews · T3-01 Frontend
         │ T2-08 UX Scores · T2-09 Recommendations · T1 Visual Foundation
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `REGRESSION_PROTECTION_ENABLED` | `true` | Enable/disable regression protection |
| `REGRESSION_PROTECTION_UX_THRESHOLD` | `5` | UX score drop threshold |
| `REGRESSION_PROTECTION_CONFIDENCE_THRESHOLD` | `0.4` | Minimum regression confidence |
| `REGRESSION_PROTECTION_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `REGRESSION_PROTECTION_TIMEOUT_MS` | `120000` | Check timeout |
| `REGRESSION_PROTECTION_LOG_LEVEL` | `info` | Logging level |
| `REGRESSION_PROTECTION_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/regression-protection` | Engine state + latest report |
| POST | `/api/pillow/regression-protection/check` | Run regression protection check |

## Completion Outcome

Stable improvements — Pillow compares proposed UI changes against known-good baselines and blocks regressive changes.

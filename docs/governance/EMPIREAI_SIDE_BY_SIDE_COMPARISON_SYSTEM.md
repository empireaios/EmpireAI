# EmpireAI Side-by-Side Comparison System

**Mission ID:** T4-05  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-SBC-001

## Constitutional Purpose

Implement Side-by-Side Comparison for Pillow. This mission consumes the Multi-Proposal Generator from T4-04 and enables the Grand King to compare redesign options visually before any approval or implementation decision.

## Scope (T4-05 Only)

Visual comparison of redesign options · layout/component/navigation/workflow/theme differences · preview linkage · UX score display · difference highlighting · structured comparison records.

**Out of scope:** Explain decisions · approval workflow · preference learning · continuous collaboration · autonomous UX evolution · automatic UX changes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Side-by-Side Comparison (T4-05 / PILLOW-SBC-001)           │
├─────────────────────────────────────────────────────────────┤
│  Side-by-Side Comparison Manager                            │
│  Comparison Session Manager                                 │
│  Proposal Comparison Engine                                 │
│  Layout / Component / Navigation / Workflow / Theme         │
│  Accessibility / Consistency Comparison Engines             │
│  Difference Highlight Engine · Preview Comparison Connector │
│  Score Comparison Connector · Comparison Metadata Generator │
│  Comparison Validator · Health Monitor · Recovery Manager   │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-04 Multi-Proposal Generator
         │ T3-05 Preview Generator · T3-06 Validation Engine
         │ T2-08 UX Scoring · T1-02 UI State Mapper
```

## Safety

- Preserves Grand King control.
- Compares options only — does **not** apply or approve changes.
- Does **not** modify files directly.
- Keeps comparison separate from implementation execution.
- Preserves traceability between proposals, previews, comparisons and future decisions.
- Does not log sensitive raw values.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SIDE_BY_SIDE_COMPARISON_ENABLED` | `true` | Enable/disable comparison |
| `SIDE_BY_SIDE_COMPARISON_MAX_OPTIONS` | `4` | Maximum compared options |
| `SIDE_BY_SIDE_COMPARISON_MAX_RETRIES` | `3` | Recovery attempts |
| `SIDE_BY_SIDE_COMPARISON_TIMEOUT_MS` | `120000` | Comparison timeout |
| `SIDE_BY_SIDE_COMPARISON_LOG_LEVEL` | `info` | Logging level |
| `SIDE_BY_SIDE_COMPARISON_AUTO_RECOVER` | `true` | Automatic recovery |

External file: `config/side-by-side-comparison.config.json`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/side-by-side-comparison` | Engine state + latest comparison report |
| POST | `/api/pillow/side-by-side-comparison/compare` | Run side-by-side comparison |

## Completion Outcome

**Compare layouts** — visual evaluation. The Grand King can compare original versus proposed layouts and proposal versus proposal options side by side before any action is taken.

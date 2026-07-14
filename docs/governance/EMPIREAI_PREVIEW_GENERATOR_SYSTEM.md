# EmpireAI Preview Generator System

**Mission ID:** T3-05  
**Status:** Active · Autonomous Builder  
**Programme:** Autonomous Builder  
**Canonical ID:** PILLOW-PG-001

## Constitutional Purpose

Implement the Preview Generator for Pillow. This mission consumes Theme Builder from T3-04 and upstream T3 outputs to generate instant, isolated preview builds for immediate UX review.

## Scope (T3-05 Only)

Instant preview builds · isolated preview environments · page/component/layout/theme previews · responsive state previews · preview cleanup · machine-readable preview records.

**Out of scope:** Validation engine · regression protection · rollback manager · change documentation · executive collaboration · continuous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Preview Generator (T3-05 / PILLOW-PG-001)                   │
├─────────────────────────────────────────────────────────────┤
│  Generation Controller → Preview Generator Manager           │
│       ↓                              ↓                      │
│  Preview Source Collector        Environment Manager         │
│  Scope Resolver                  Route Manager               │
│  Responsive Preview Engine       Assembly Engine             │
│       ↓                              ↓                      │
│  Safety Checker                  Output Validator            │
│       ↓                              ↓                      │
│  Health Monitor                  Recovery Manager            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T3-01 Frontend Build · T3-02 Components
         │ T3-03 Layout Refactoring · T3-04 Themes
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PREVIEW_GENERATOR_ENABLED` | `true` | Enable/disable preview generator |
| `PREVIEW_GENERATOR_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `PREVIEW_GENERATOR_TIMEOUT_MS` | `120000` | Build timeout |
| `PREVIEW_GENERATOR_RETENTION_MS` | `3600000` | Preview environment retention |
| `PREVIEW_GENERATOR_LOG_LEVEL` | `info` | Logging level |
| `PREVIEW_GENERATOR_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/preview-generator` | Generator state + latest report |
| POST | `/api/pillow/preview-generator/build` | Generate instant preview builds |
| POST | `/api/pillow/preview-generator/cleanup` | Clean expired preview environments |

## Completion Outcome

Immediate review — Pillow produces isolated preview builds before changes are accepted or advanced.

# EmpireAI Theme Builder System

**Mission ID:** T3-04  
**Status:** Active · Autonomous Builder  
**Programme:** Autonomous Builder  
**Canonical ID:** PILLOW-TB-001

## Constitutional Purpose

Implement the Theme Builder for Pillow. This mission consumes Layout Refactoring from T3-03 and certified UX Intelligence to generate safe, consistent visual themes for the EmpireAI interface.

## Scope (T3-04 Only)

Theme generation · color/typography/spacing/sizing tokens · border/radius/shadow tokens · interaction-state themes · component theme variants · dynamic visual styling · machine-readable theme records.

**Out of scope:** Preview generator · validation engine · regression protection · rollback manager · change documentation · executive collaboration · continuous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Theme Builder (T3-04 / PILLOW-TB-001)                       │
├─────────────────────────────────────────────────────────────┤
│  Generation Controller → Theme Builder Manager               │
│       ↓                              ↓                      │
│  Requirement Interpreter         Design System Constraints   │
│  Executive Preference Constraints                            │
│  Color / Typography / Spacing / Interaction Generators       │
│  Component Variant Generator     Theme Token Generator       │
│       ↓                              ↓                      │
│  Theme Code Assembler            Safety Checker              │
│       ↓                              ↓                      │
│  Output Validator                Health Monitor              │
│                                  Recovery Manager            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T2-02 Design System · T2-03 Executive Style · T2-09 Recommendations
         │ T3-01 Frontend Build · T3-02 Components · T3-03 Layout Refactoring
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `THEME_BUILDER_ENABLED` | `true` | Enable/disable theme builder |
| `THEME_BUILDER_CONFIDENCE_THRESHOLD` | `0.4` | Minimum recommendation confidence |
| `THEME_BUILDER_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `THEME_BUILDER_TIMEOUT_MS` | `120000` | Generation timeout |
| `THEME_BUILDER_LOG_LEVEL` | `info` | Logging level |
| `THEME_BUILDER_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/theme-builder` | Builder state + latest report |
| POST | `/api/pillow/theme-builder/generate` | Generate visual themes |

## Completion Outcome

Dynamic visual styling — Pillow generates design-system-aligned themes from approved UX intelligence.

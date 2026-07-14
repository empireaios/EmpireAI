# EmpireAI Executive Style Learning System

**Mission ID:** T2-03  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-ESL-001

## Constitutional Purpose

Implement Executive Style Learning for Pillow. This mission consumes the Design System Intelligence produced by T2-02 and enables Pillow to learn the Grand King's UX preferences from approved and rejected design decisions.

## Scope (T2-03 Only)

Learning design preferences from explicit approvals and rejections · preferred layouts, components, typography, colors, spacing, navigation, dashboards, interactions, visual density, and consistency patterns · preference model generation · versioning · conflict resolution · validation · health monitoring · automatic recovery.

**Out of scope:** Layout evaluation · workflow optimization · accessibility intelligence · visual consistency engine · UX scoring · recommendation generation · autonomous frontend building · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Executive Style Learning (T2-03 / PILLOW-ESL-001)          │
├─────────────────────────────────────────────────────────────┤
│  Style Learning Controller → Executive Style Learning Manager│
│       ↓                              ↓                      │
│  Preference Learning Engine    Approval / Rejection Analyzers│
│       ↓                              ↓                      │
│  Preference Model Builder      Preference Version Manager     │
│       ↓                              ↓                      │
│  Preference Conflict Resolver  Preference Metadata Generator │
│       ↓                              ↓                      │
│  Executive Preference Validator                               │
│       ↓                              ↓                      │
│  Health Monitor                Recovery Manager             │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Design System Intelligence (T2-02)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `EXECUTIVE_STYLE_LEARNING_ENABLED` | `true` | Enable/disable executive style learning |
| `EXECUTIVE_STYLE_LEARNING_APPROVAL_WEIGHT` | `0.15` | Confidence boost per approval |
| `EXECUTIVE_STYLE_LEARNING_REJECTION_WEIGHT` | `0.2` | Confidence reduction per rejection |
| `EXECUTIVE_STYLE_LEARNING_CONFIDENCE_THRESHOLD` | `0.4` | Minimum confidence for active preferences |
| `EXECUTIVE_STYLE_LEARNING_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `EXECUTIVE_STYLE_LEARNING_TIMEOUT_MS` | `60000` | Learning timeout |
| `EXECUTIVE_STYLE_LEARNING_LOG_LEVEL` | `info` | Logging level |
| `EXECUTIVE_STYLE_LEARNING_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/executive-style-learning` | Learning state + latest model |
| POST | `/api/pillow/executive-style-learning/learn` | Run preference learning |
| POST | `/api/pillow/executive-style-learning/approve` | Record design approval |
| POST | `/api/pillow/executive-style-learning/reject` | Record design rejection |

## Completion Outcome

Personalized design — Pillow learns the Grand King's UX preferences and maintains versioned preference models for future UX intelligence.

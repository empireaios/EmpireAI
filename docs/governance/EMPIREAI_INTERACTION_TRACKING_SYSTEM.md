# EmpireAI Interaction Tracking System

**Mission ID:** T1-06  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-ITE-001

## Constitutional Purpose

Implement Interaction Tracking for Pillow. This mission consumes the navigation graph produced by T1-05 and enables Pillow to observe user interactions with the EmpireAI interface.

## Scope (T1-06 Only)

Click · text input · form edits · selections · scroll · hover · keyboard · navigation-triggering interactions · modal/drawer/tab flows · component/region/navigation mapping · timestamped events · validation · health monitoring · automatic recovery · sensitive value masking.

**Out of scope:** Workflow/context awareness · visual memory · session continuity · UX evaluation · AI reasoning · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Interaction Tracking Engine (T1-06 / PILLOW-ITE-001)      │
├─────────────────────────────────────────────────────────────┤
│  Interaction Tracking Manager → Interaction Controller        │
│       ↓                              ↓                      │
│  Interaction Analysis Engine   Tracking Scheduler           │
│       ↓                              ↓                      │
│  Event Listener Engine     Interaction Event Normalizer     │
│       ↓                              ↓                      │
│  Component Interaction Mapper  Navigation Interaction Mapper  │
│       ↓                              ↓                      │
│  Pointer/Keyboard/Scroll/Input Activity Trackers            │
│       ↓                              ↓                      │
│  Interaction Validator  Health Monitor  Recovery Manager    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Navigation graph (T1-05) · Layout (T1-04) · Components (T1-03)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `INTERACTION_TRACKING_ENABLED` | `true` | Enable/disable tracking |
| `INTERACTION_TRACKING_INTERVAL_MS` | `500` | Polling interval |
| `INTERACTION_TRACKING_MASK_SENSITIVE` | `true` | Mask password/token fields |
| `INTERACTION_TRACKING_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/interaction-tracking` | Full tracking state + recent events |
| POST | `/api/pillow/interaction-tracking/start` | Start live tracking |
| POST | `/api/pillow/interaction-tracking/stop` | Stop live tracking |
| POST | `/api/pillow/interaction-tracking/record` | Ingest a raw interaction event |

## Privacy

Password, token, secret, payment, and configured sensitive fields are masked as `[REDACTED]`. Sensitive raw values are never logged.

## Completion Outcome

Pillow observes user interactions with timestamped events mapped to components, layout regions, and navigation graph nodes/edges.

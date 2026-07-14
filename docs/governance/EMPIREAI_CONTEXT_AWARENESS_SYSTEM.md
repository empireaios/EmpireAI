# EmpireAI Context Awareness System

**Mission ID:** T1-07  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-CAE-001

## Constitutional Purpose

Implement Context Awareness for Pillow. This mission consumes interaction awareness from T1-06 and enables Pillow to understand the current workflow taking place inside the EmpireAI interface.

## Scope (T1-07 Only)

Workflow context detection · screen purpose · user task inference · active forms/panels/modals · navigation flow · multi-step flow position · interaction mode · context change detection · validation · health monitoring · automatic recovery.

**Out of scope:** Visual memory · session continuity · UX evaluation · AI reasoning · autonomous redesign · workflow optimization · recommendation generation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Context Awareness Engine (T1-07 / PILLOW-CAE-001)       │
├─────────────────────────────────────────────────────────────┤
│  Context Awareness Manager → Context Controller             │
│       ↓                              ↓                      │
│  Context Analysis Engine     Context Scheduler              │
│       ↓                              ↓                      │
│  Workflow Context Engine     Screen Purpose Detector        │
│       ↓                              ↓                      │
│  Active Task/Form/Modal Detectors  Navigation Context Mapper  │
│       ↓                              ↓                      │
│  Workflow Step Detector  Context Change Detector             │
│       ↓                              ↓                      │
│  Context Metadata Generator  Context Validator              │
│       ↓                              ↓                      │
│  Health Monitor  Recovery Manager  Context Buffer             │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Interaction events (T1-06) · Navigation (T1-05) · Layout (T1-04) · Components (T1-03)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CONTEXT_AWARENESS_ENABLED` | `true` | Enable/disable context awareness |
| `CONTEXT_AWARENESS_INTERVAL_MS` | `1000` | Context update polling interval |
| `CONTEXT_AWARENESS_CONFIDENCE` | `0.5` | Minimum confidence threshold |
| `CONTEXT_AWARENESS_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/context-awareness` | Full context awareness state + latest workflow context |
| POST | `/api/pillow/context-awareness/start` | Start live context awareness |
| POST | `/api/pillow/context-awareness/stop` | Stop live context awareness |

## Privacy

Sensitive raw values from upstream interaction events are never logged. Context logs record event types, IDs, and structural metadata only.

## Completion Outcome

Pillow understands the current EmpireAI workflow and produces machine-readable workflow context metadata.

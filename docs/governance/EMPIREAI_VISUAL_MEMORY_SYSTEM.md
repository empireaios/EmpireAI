# EmpireAI Visual Memory System

**Mission ID:** T1-08  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-VME-001

## Constitutional Purpose

Implement Visual Memory for Pillow. This mission consumes workflow context from T1-07 and enables Pillow to store historical UI states from the EmpireAI interface.

## Scope (T1-08 Only)

Historical UI state storage · component/layout/navigation/interaction/workflow context history · indexed retrieval · state comparison · retention policies · sensitive value masking · validation · health monitoring · automatic recovery.

**Out of scope:** Session continuity · UX evaluation · AI reasoning · autonomous redesign · workflow optimization · recommendation generation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Visual Memory Engine (T1-08 / PILLOW-VME-001)            │
├─────────────────────────────────────────────────────────────┤
│  Visual Memory Manager → Memory Controller                   │
│       ↓                              ↓                      │
│  Memory Capture Engine       Memory Scheduler              │
│       ↓                              ↓                      │
│  UI/Component/Layout/Nav/Interaction/Workflow History Stores │
│       ↓                              ↓                      │
│  Memory Indexer  Memory Persistence Store  Memory Buffer    │
│       ↓                              ↓                      │
│  Memory Retrieval Engine  Memory Comparison Engine           │
│       ↓                              ↓                      │
│  Memory Retention Manager  Memory Validator                  │
│       ↓                              ↓                      │
│  Health Monitor  Recovery Manager  Sensitive Sanitizer       │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Workflow context (T1-07) · Interactions (T1-06) · Navigation (T1-05)
         │ Layout (T1-04) · Components (T1-03) · UI State (T1-02) · Frames (T1-01)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VISUAL_MEMORY_ENABLED` | `true` | Enable/disable visual memory |
| `VISUAL_MEMORY_INTERVAL_MS` | `2000` | Memory capture polling interval |
| `VISUAL_MEMORY_STORAGE_BACKEND` | `file` | Storage backend (`file` or `memory`) |
| `VISUAL_MEMORY_MASK_SENSITIVE` | `true` | Mask sensitive field values |
| `VISUAL_MEMORY_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/visual-memory` | Full visual memory state + latest record |
| POST | `/api/pillow/visual-memory/start` | Start live memory recording |
| POST | `/api/pillow/visual-memory/stop` | Stop live memory recording |
| POST | `/api/pillow/visual-memory/capture` | Capture memory record immediately |

## Privacy

Password, token, secret, payment, and configured sensitive fields are masked as `[REDACTED]`. Raw image data is never persisted — only frame references when snapshots are enabled. Sensitive raw values are never logged.

## Completion Outcome

Pillow stores historical UI states persistently and retrieves them via indexed lookup.

# EmpireAI UI State Mapper System

**Mission ID:** T1-02  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-USM-001

## Constitutional Purpose

Implement the UI State Mapper for Pillow. This mission consumes the live visual feed produced by T1-01 and converts every captured screen into a structured, machine-readable representation of the current UI state.

## Scope (T1-02 Only)

Frame consumption · UI state model generation · state change detection · metadata · health monitoring · automatic recovery.

**Out of scope:** Component recognition · layout understanding · navigation mapping · interaction tracking · workflow awareness · visual memory · session continuity · UX evaluation · AI reasoning · OCR.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│           UI State Mapper (T1-02 / PILLOW-USM-001)          │
├─────────────────────────────────────────────────────────────┤
│  UI State Manager → Mapping Controller → Mapping Scheduler  │
│       ↓                    ↓                    ↓           │
│  State Mapping Engine  State Model Builder  State Buffer    │
│       ↓                    ↓                    ↓           │
│  Region Mapper → State Change Detector → State Serializer   │
│       ↓                    ↓                    ↓           │
│  Metadata Generator  Validation Engine  Health Monitor      │
│       ↓                                      ↓              │
│  Recovery Manager ←─────────── Mapping Logging              │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ frames from T1-01 Visual Capture Engine
```

## Subsystems

| Subsystem | Module | Responsibility |
|-----------|--------|----------------|
| UI State Manager | `ui-state-manager.ts` | Mapping session lifecycle |
| Mapping Controller | `mapping-controller.ts` | Start · stop · pause · resume orchestration |
| State Mapping Engine | `state-mapping-engine.ts` | Per-frame mapping pipeline |
| State Model Builder | `state-model-builder.ts` | Machine-readable UI model construction |
| State Change Detector | `state-change-detector.ts` | Appeared · disappeared · modified regions |
| Region Mapper | `region-mapper.ts` | Visible region boundaries and signatures |
| State Serializer | `state-serializer.ts` | Deterministic JSON serialization |
| Metadata Generator | `metadata-generator.ts` | Per-state metadata |
| Validation Engine | `validation-engine.ts` | State model validation |
| Health Monitor | `health-monitor.ts` | Operational health reporting |
| Recovery Manager | `recovery-manager.ts` | Automatic recovery |

## State Model

Every UI state includes:

- Current screen ID and dimensions
- Visible UI regions with boundaries
- Parent-child hierarchy
- Region content signatures
- State change summary (appeared · disappeared · modified)
- Deterministic serialized representation

## Configuration

Externalized via environment variables and optional `ui-state-mapper.config.json`:

| Variable | Default | Description |
|----------|---------|-------------|
| `UI_STATE_MAPPER_ENABLED` | `true` | Enable/disable mapping |
| `UI_STATE_MAPPER_INTERVAL_MS` | `1000` | Update interval |
| `UI_STATE_MAPPER_MAX_RATE` | `5` | Maximum update rate |
| `UI_STATE_MAPPER_SERIALIZATION` | `json` | `json` · `compact-json` |
| `UI_STATE_MAPPER_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/ui-state-mapper` | Full mapping state + latest UI model |
| POST | `/api/pillow/ui-state-mapper/start` | Start live mapping |
| POST | `/api/pillow/ui-state-mapper/stop` | Stop live mapping |

## Completion Outcome

Pillow converts every captured screen into a machine-readable UI model with stable state generation, reliable updates, metadata, validation, health monitoring, and automatic recovery.

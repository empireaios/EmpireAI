# EmpireAI Component Recognition System

**Mission ID:** T1-03  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-CRE-001

## Constitutional Purpose

Implement Component Recognition for Pillow. This mission consumes the machine-readable UI model produced by T1-02 and identifies all visible UI components in the EmpireAI interface.

## Scope (T1-03 Only)

Component detection · type classification · stable identifiers · hierarchy · change detection · metadata · health monitoring · automatic recovery.

**Out of scope:** Layout understanding · navigation mapping · interaction tracking · workflow awareness · visual memory · UX evaluation · AI reasoning · OCR.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Component Recognition Engine (T1-03 / PILLOW-CRE-001)   │
├─────────────────────────────────────────────────────────────┤
│  Component Recognition Manager → Recognition Controller     │
│       ↓                              ↓                      │
│  Component Detection Engine    Recognition Scheduler          │
│       ↓                              ↓                      │
│  Component Classifier → Identity Manager → Hierarchy Mapper │
│       ↓                              ↓                      │
│  Change Detector → Metadata Generator → Result Buffer         │
│       ↓                              ↓                      │
│  Recognition Validator  Health Monitor  Recovery Manager    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ UI state models from T1-02 UI State Mapper
```

## Subsystems

| Subsystem | Module | Responsibility |
|-----------|--------|----------------|
| Component Recognition Manager | `component-recognition-manager.ts` | Session lifecycle |
| Recognition Controller | `recognition-controller.ts` | Start · stop · pause · resume |
| Component Detection Engine | `component-detection-engine.ts` | Per-state detection pipeline |
| Component Classifier | `component-classifier.ts` | Type classification |
| Component Identity Manager | `component-identity-manager.ts` | Stable component IDs |
| Component Hierarchy Mapper | `component-hierarchy-mapper.ts` | Parent-child relationships |
| Component Change Detector | `component-change-detector.ts` | Appeared · disappeared · changed |
| Component Metadata Generator | `component-metadata-generator.ts` | Per-recognition metadata |
| Recognition Validator | `recognition-validator.ts` | Result validation |
| Health Monitor | `health-monitor.ts` | Operational health |
| Recovery Manager | `recovery-manager.ts` | Automatic recovery |

## Component Types

Recognizes: button · link · input · text_field · text_area · dropdown · checkbox · radio_button · toggle · tab · menu · navigation_item · card · modal · dialog · table · list · form · icon · image · chart · panel · sidebar · header · footer · alert · toast · tooltip · loading_indicator.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `COMPONENT_RECOGNITION_ENABLED` | `true` | Enable/disable recognition |
| `COMPONENT_RECOGNITION_INTERVAL_MS` | `1000` | Recognition interval |
| `COMPONENT_RECOGNITION_CONFIDENCE` | `0.5` | Confidence threshold |
| `COMPONENT_RECOGNITION_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/component-recognition` | Full recognition state + latest result |
| POST | `/api/pillow/component-recognition/start` | Start live recognition |
| POST | `/api/pillow/component-recognition/stop` | Stop live recognition |

## Completion Outcome

Pillow detects all visible UI components with stable IDs, classification, hierarchy, metadata, validation, health monitoring, and automatic recovery.

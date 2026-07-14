# EmpireAI Navigation Mapping System

**Mission ID:** T1-05  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-NME-001

## Constitutional Purpose

Implement Navigation Mapping for Pillow. This mission consumes structural layout understanding produced by T1-04 and enables Pillow to map how the EmpireAI interface flows between screens, pages, routes, views and navigation states.

## Scope (T1-05 Only)

Screen identity · route/view detection · navigation entry points · destinations · transitions · navigation graph · parent-child relationships · sidebar/top/modal/drawer/tab flows · change detection · metadata · validation · health monitoring · automatic recovery.

**Out of scope:** Interaction tracking · workflow/context awareness · visual memory · session continuity · UX evaluation · AI reasoning · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Navigation Mapping Engine (T1-05 / PILLOW-NME-001)       │
├─────────────────────────────────────────────────────────────┤
│  Navigation Mapping Manager → Navigation Controller          │
│       ↓                              ↓                      │
│  Navigation Analysis Engine    Mapping Scheduler            │
│       ↓                              ↓                      │
│  Screen Identity Engine    Route State Detector             │
│       ↓                              ↓                      │
│  Navigation Entry Detector  Transition Mapper               │
│       ↓                              ↓                      │
│  Navigation Graph Builder  Navigation Relationship Mapper   │
│       ↓                              ↓                      │
│  Navigation Change Detector  Navigation Metadata Generator  │
│       ↓                              ↓                      │
│  Navigation Validator  Health Monitor  Recovery Manager     │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Layout models from T1-04 Layout Understanding
```

## Subsystems

| Subsystem | Module | Responsibility |
|-----------|--------|----------------|
| Navigation Mapping Manager | `navigation-mapping-manager.ts` | Session lifecycle |
| Navigation Controller | `navigation-controller.ts` | Start · stop · pause · resume |
| Navigation Analysis Engine | `navigation-analysis-engine.ts` | Per-layout mapping pipeline |
| Screen Identity Engine | `screen-identity-rules.ts` | Current screen/route/view identity |
| Route State Detector | `route-state-detector.ts` | Route and view change detection |
| Navigation Entry Detector | `navigation-entry-rules.ts` | Entry points and destinations |
| Transition Mapper | `transition-mapper.ts` | Screen-to-screen transitions |
| Navigation Graph Builder | `navigation-graph-builder.ts` | Cumulative graph construction |
| Navigation Relationship Mapper | `navigation-relationship-mapper.ts` | Parent-child · modal · drawer · tab |
| Navigation Change Detector | `navigation-change-detector.ts` | Graph change summary |
| Navigation Metadata Generator | `navigation-metadata-generator.ts` | Per-graph metadata |
| Navigation Validator | `navigation-validator.ts` | Graph validation |
| Health Monitor | `health-monitor.ts` | Operational health |
| Recovery Manager | `recovery-manager.ts` | Automatic recovery |

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NAVIGATION_MAPPING_ENABLED` | `true` | Enable/disable navigation mapping |
| `NAVIGATION_MAPPING_INTERVAL_MS` | `1000` | Mapping interval |
| `NAVIGATION_MAPPING_CONFIDENCE` | `0.5` | Confidence threshold |
| `NAVIGATION_MAPPING_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/navigation-mapping` | Full mapping state + latest graph |
| POST | `/api/pillow/navigation-mapping/start` | Start live navigation mapping |
| POST | `/api/pillow/navigation-mapping/stop` | Stop live navigation mapping |

## Completion Outcome

Pillow learns the EmpireAI application flow with a machine-readable navigation graph including nodes, edges, entry points, destinations, transitions, validation, health monitoring, and automatic recovery.

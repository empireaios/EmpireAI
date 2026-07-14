# EmpireAI Layout Understanding System

**Mission ID:** T1-04  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-LUE-001

## Constitutional Purpose

Implement Layout Understanding for Pillow. This mission consumes component awareness produced by T1-03 and enables Pillow to understand the structural layout of the current EmpireAI interface.

## Scope (T1-04 Only)

Page-level structure · major layout regions · spatial relationships · parent-child layout relationships · grouping · alignment · stacking order · responsive layout changes · layout change detection · metadata · validation · health monitoring · automatic recovery.

**Out of scope:** Navigation mapping · interaction tracking · workflow/context awareness · visual memory · session continuity · UX evaluation · AI reasoning · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│     Layout Understanding Engine (T1-04 / PILLOW-LUE-001)    │
├─────────────────────────────────────────────────────────────┤
│  Layout Understanding Manager → Layout Controller           │
│       ↓                              ↓                      │
│  Layout Analysis Engine        Layout Scheduler             │
│       ↓                              ↓                      │
│  Structural Region Detector  Spatial Relationship Mapper    │
│       ↓                              ↓                      │
│  Grouping Engine → Alignment Analyzer → Stacking Analyzer   │
│       ↓                              ↓                      │
│  Responsive Layout Detector  Layout Change Detector         │
│       ↓                              ↓                      │
│  Layout Metadata Generator  Layout Validator                  │
│       ↓                              ↓                      │
│  Health Monitor  Recovery Manager  Layout Buffer            │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Component models from T1-03 Component Recognition
```

## Subsystems

| Subsystem | Module | Responsibility |
|-----------|--------|----------------|
| Layout Understanding Manager | `layout-understanding-manager.ts` | Session lifecycle |
| Layout Controller | `layout-controller.ts` | Start · stop · pause · resume |
| Layout Analysis Engine | `layout-analysis-engine.ts` | Per-recognition layout pipeline |
| Structural Region Detector | `structural-region-rules.ts` | Header · sidebar · content · modal · etc. |
| Spatial Relationship Mapper | `spatial-relationship-mapper.ts` | Above · below · contains · overlaps |
| Grouping Engine | `grouping-engine.ts` | Row · column · cluster grouping |
| Alignment Analyzer | `alignment-analyzer.ts` | Left · center · right · top · bottom |
| Responsive Layout Detector | `responsive-layout-detector.ts` | Breakpoint detection |
| Layout Change Detector | `layout-change-detector.ts` | Region appeared · disappeared · modified |
| Layout Metadata Generator | `layout-metadata-generator.ts` | Per-layout metadata |
| Layout Validator | `layout-validator.ts` | Model validation |
| Health Monitor | `health-monitor.ts` | Operational health |
| Recovery Manager | `recovery-manager.ts` | Automatic recovery |

## Structural Regions

Recognizes: header · top_navigation · sidebar · main_content · footer · panel · card_group · form_area · table_area · chart_area · modal · dialog · drawer · toolbar · filter_area · search_area · status_area · empty_state · loading_state.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `LAYOUT_UNDERSTANDING_ENABLED` | `true` | Enable/disable layout analysis |
| `LAYOUT_UNDERSTANDING_INTERVAL_MS` | `1000` | Analysis interval |
| `LAYOUT_UNDERSTANDING_CONFIDENCE` | `0.5` | Confidence threshold |
| `LAYOUT_UNDERSTANDING_AUTO_START` | `true` | Auto-start on Pillow boot |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/layout-understanding` | Full layout state + latest model |
| POST | `/api/pillow/layout-understanding/start` | Start live layout analysis |
| POST | `/api/pillow/layout-understanding/stop` | Stop live layout analysis |

## Completion Outcome

Pillow understands visible page layouts structurally with major regions, component-to-region assignments, spatial/alignment/grouping relationships, responsive detection, validation, health monitoring, and automatic recovery.

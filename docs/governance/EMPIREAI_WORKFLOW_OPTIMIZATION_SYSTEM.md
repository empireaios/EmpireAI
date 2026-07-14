# EmpireAI Workflow Optimization System

**Mission ID:** T2-05  
**Status:** Active · UX Intelligence  
**Programme:** UX Intelligence  
**Canonical ID:** PILLOW-WFO-001

## Constitutional Purpose

Implement Workflow Optimization for Pillow. This mission consumes Layout Evaluation from T2-04 and enables Pillow to identify workflow friction inside the EmpireAI interface and produce machine-readable optimization findings.

## Scope (T2-05 Only)

Workflow friction detection · excessive steps · repeated actions · unclear decision points · unnecessary navigation · slow task paths · confusing forms · poor screen sequencing · dead ends · loading friction · workflow strengths · machine-readable optimization findings · health monitoring · automatic recovery.

**Out of scope:** Accessibility intelligence · visual consistency engine · UX scoring · recommendation generation · autonomous frontend building · autonomous redesign.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Workflow Optimization (T2-05 / PILLOW-WFO-001)               │
├─────────────────────────────────────────────────────────────┤
│  Optimization Controller → Workflow Optimization Manager      │
│       ↓                              ↓                      │
│  Workflow Analysis Engine      Task Path / Step Analyzers   │
│       ↓                        Interaction / Navigation      │
│  Repetition / Form / Decision / Waiting Analyzers           │
│  Workflow Strength Detector    Workflow Finding Generator   │
│       ↓                              ↓                      │
│  Workflow Validator            Health Monitor / Recovery    │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ Context (T1-07) · Interactions (T1-06) · Navigation (T1-05) · Layout Eval (T2-04)
```

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKFLOW_OPTIMIZATION_ENABLED` | `true` | Enable/disable workflow optimization |
| `WORKFLOW_OPTIMIZATION_STEP_THRESHOLD` | `5` | Max steps before friction flag |
| `WORKFLOW_OPTIMIZATION_REPETITION_THRESHOLD` | `3` | Repeated action threshold |
| `WORKFLOW_OPTIMIZATION_CONFIDENCE_THRESHOLD` | `0.4` | Minimum confidence for findings |
| `WORKFLOW_OPTIMIZATION_MAX_RETRIES` | `3` | Maximum recovery attempts |
| `WORKFLOW_OPTIMIZATION_TIMEOUT_MS` | `60000` | Analysis timeout |
| `WORKFLOW_OPTIMIZATION_LOG_LEVEL` | `info` | Logging level |
| `WORKFLOW_OPTIMIZATION_AUTO_RECOVER` | `true` | Automatic recovery on failures |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/workflow-optimization` | Optimization state + latest report |
| POST | `/api/pillow/workflow-optimization/analyze` | Run workflow analysis |

## Completion Outcome

Better usability — Pillow analyzes EmpireAI workflows and identifies how usability can be improved.

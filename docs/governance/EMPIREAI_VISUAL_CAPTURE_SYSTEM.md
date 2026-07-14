# EmpireAI Visual Capture System

**Mission ID:** T1-01  
**Status:** Active · Visual Foundation  
**Programme:** Visual Foundation  
**Canonical ID:** PILLOW-VCE-001

## Constitutional Purpose

Establish the foundational Visual Capture Engine for Pillow. This mission is strictly limited to acquiring a live visual feed of the EmpireAI interface. Pillow receives live UI frames upon which later T-series missions will build.

## Scope (T1-01 Only)

Live screen acquisition · continuous capture · frame metadata · health monitoring · automatic recovery.

**Out of scope:** UI state mapping · OCR · text extraction · component recognition · layout understanding · navigation mapping · interaction tracking · workflow awareness · visual memory · session continuity · UX evaluation · AI reasoning.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│         Visual Capture Engine (T1-01 / PILLOW-VCE-001)        │
├─────────────────────────────────────────────────────────────┤
│  Capture Controller → Session Manager → Scheduler           │
│       ↓                    ↓              ↓                │
│  Window Selection    Display Manager   Frame Buffer          │
│       ↓                    ↓              ↓                    │
│  Frame Acquisition → Metadata Generator → Health Monitor     │
│       ↓                                      ↓                │
│  Recovery Manager ←─────────── Capture Logging                │
└─────────────────────────────────────────────────────────────┘
```

## Subsystems

| Subsystem | Module | Responsibility |
|-----------|--------|----------------|
| Capture Controller | `capture-controller.ts` | Start · stop · pause · resume orchestration |
| Capture Session Manager | `capture-session-manager.ts` | Session lifecycle |
| Window Selection Manager | `window-selection-manager.ts` | EmpireAI window discovery |
| Display Manager | `display-manager.ts` | Multi-monitor · resolution detection |
| Frame Acquisition Engine | `frame-acquisition-engine.ts` | PNG frame capture |
| Capture Scheduler | `capture-scheduler.ts` | Configurable capture interval |
| Frame Buffer | `frame-buffer.ts` | Ring buffer · backlog prevention |
| Capture Metadata Generator | `capture-metadata-generator.ts` | Per-frame metadata |
| Health Monitor | `health-monitor.ts` | Operational health reporting |
| Recovery Manager | `recovery-manager.ts` | Automatic recovery |

## Configuration

Externalized via environment variables and optional `visual-capture.config.json`:

| Variable | Default | Description |
|----------|---------|-------------|
| `VISUAL_CAPTURE_ENABLED` | `true` | Enable/disable capture |
| `VISUAL_CAPTURE_INTERVAL_MS` | `1000` | Capture interval |
| `VISUAL_CAPTURE_MAX_FPS` | `5` | Maximum frame rate |
| `VISUAL_CAPTURE_SOURCE` | `browser_viewport` | `browser_viewport` · `native_window` · `display` |
| `VISUAL_CAPTURE_URL` | `http://localhost:3000/cockpit` | EmpireAI capture target |
| `VISUAL_CAPTURE_AUTO_START` | `true` | Auto-start on Pillow boot |

## Frame Metadata

Every frame includes: timestamp · session ID · frame number · window ID · display ID · resolution · viewport dimensions · capture duration · capture status · error (if applicable).

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/visual-capture` | Full capture state + latest frame |
| POST | `/api/pillow/visual-capture/start` | Start live capture |
| POST | `/api/pillow/visual-capture/stop` | Stop live capture |

## Completion Outcome

Pillow continuously receives a live visual feed of the EmpireAI interface with stable capture, operational metadata, health monitoring, and automatic recovery.

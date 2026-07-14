# EmpireAI Screen Annotation System

**Mission ID:** T4-03  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-SA-001

## Constitutional Purpose

Implement Screen Annotation for Pillow. This mission consumes Voice UX Commands from T4-02 and enables the Grand King to point at, mark, annotate and reference visible EmpireAI interface areas for UX collaboration.

## Scope (T4-03 Only)

Point-and-edit visual collaboration · pointer capture · annotation capture · coordinate mapping · component/layout/navigation mapping · UX finding linkage · point-and-edit intent generation.

**Out of scope:** Multi-proposal generation · side-by-side comparison · explain decisions · approval workflow · preference learning · continuous collaboration · autonomous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Screen Annotation (T4-03 / PILLOW-SA-001)                  │
├─────────────────────────────────────────────────────────────┤
│  Screen Annotation Manager                                    │
│  Annotation Session Manager                                   │
│  Pointer Capture Engine · Annotation Capture Engine           │
│  Screen Coordinate Mapper                                     │
│  Component / Layout / Navigation Annotation Mappers           │
│  UX Finding Annotation Linker                                 │
│  Point-and-Edit Intent Generator                            │
│  Annotation Metadata Generator · Annotation Validator         │
│  Health Monitor · Recovery Manager                          │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-02 Voice UX Commands · T4-01 Natural UX Conversation
         │ T1 UI State · T2 UX Intelligence · T3 Builder Certification
```

## Safety

- Preserves Grand King control.
- Does **not** apply UX changes automatically.
- Does **not** approve changes automatically.
- Does **not** modify files directly.
- Does **not** log sensitive screen content, secrets, or private inputs.
- Keeps annotation interpretation separate from implementation execution.
- Preserves traceability between annotation, intent, and future action.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `SCREEN_ANNOTATION_ENABLED` | `true` | Enable/disable screen annotation |
| `SCREEN_ANNOTATION_CONFIDENCE_THRESHOLD` | `0.55` | Minimum confidence |
| `SCREEN_ANNOTATION_MAX_RETRIES` | `3` | Recovery attempts |
| `SCREEN_ANNOTATION_TIMEOUT_MS` | `120000` | Annotation timeout |
| `SCREEN_ANNOTATION_LOG_LEVEL` | `info` | Logging level |
| `SCREEN_ANNOTATION_AUTO_RECOVER` | `true` | Automatic recovery |

External file: `config/screen-annotation.config.json`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/screen-annotation` | Engine state + latest report |
| POST | `/api/pillow/screen-annotation/annotate` | Capture a screen annotation |

## Completion Outcome

Point-and-edit — visual collaboration. The Grand King can visually indicate what should be discussed, reviewed or changed.

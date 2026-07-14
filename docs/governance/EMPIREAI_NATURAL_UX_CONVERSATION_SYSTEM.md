# EmpireAI Natural UX Conversation System

**Mission ID:** T4-01  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-NUC-001

## Constitutional Purpose

Implement Natural UX Conversation for Pillow. This mission begins T4 Executive Collaboration and consumes the certified Autonomous Builder from T3-10 so the Grand King can communicate naturally with Pillow about EmpireAI UX and frontend improvements.

## Scope (T4-01 Only)

Natural-language UX requests · intent recognition · conversational context · clarification · structured UX actions · structured builder requests (no direct execution).

**Out of scope:** Voice UX commands · screen annotation · multi-proposal generation · side-by-side comparison · explain decisions · approval workflow · preference learning · continuous collaboration · Executive Collaboration certification · continuous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Natural UX Conversation (T4-01 / PILLOW-NUC-001)           │
├─────────────────────────────────────────────────────────────┤
│  Conversation Controller → Conversation Manager             │
│       ↓                              ↓                      │
│  Session Manager                 Intent Recognition         │
│  UX Intent Interpreter           Context / Memory Managers  │
│  Clarification Engine            Action Planning Engine     │
│  Builder Request Generator       Conversation Validator     │
│       ↓                              ↓                      │
│  Health Monitor                  Recovery Manager           │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T3-10 Autonomous Builder Certification
         │ T2 UX Intelligence · T3 Frontend Builder
```

## Safety

- Does **not** execute frontend changes directly.
- Builder requests are structured only and remain unforwarded until later certified workflows.
- Clarification is required when confidence is insufficient or UX references are missing.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NATURAL_UX_CONVERSATION_ENABLED` | `true` | Enable/disable conversation |
| `NATURAL_UX_CONVERSATION_CONFIDENCE_THRESHOLD` | `0.55` | Minimum confidence |
| `NATURAL_UX_CONVERSATION_MAX_RETRIES` | `3` | Recovery attempts |
| `NATURAL_UX_CONVERSATION_TIMEOUT_MS` | `120000` | Hard timeout |
| `NATURAL_UX_CONVERSATION_LOG_LEVEL` | `info` | Logging level |
| `NATURAL_UX_CONVERSATION_AUTO_RECOVER` | `true` | Automatic recovery |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/natural-ux-conversation` | Engine state + latest report |
| POST | `/api/pillow/natural-ux-conversation/converse` | Process a natural UX turn |

## Completion Outcome

Conversational design — the Grand King can communicate naturally with Pillow regarding EmpireAI UX and frontend improvements.

# EmpireAI Voice UX Commands System

**Mission ID:** T4-02  
**Status:** Active · Executive Collaboration  
**Programme:** Executive Collaboration  
**Canonical ID:** PILLOW-VUC-001

## Constitutional Purpose

Implement Voice UX Commands for Pillow. This mission consumes the Natural UX Conversation produced by T4-01 and enables the Grand King to issue UX redesign commands by voice.

## Scope (T4-02 Only)

Voice-based UX command intake and interpretation · speech-to-text · voice intent parsing · UI/UX/builder context mapping · clarification · structured voice command records · connection to Natural UX Conversation.

**Out of scope:** Screen annotation · multi-proposal generation · side-by-side comparison · explain decisions · approval workflow · preference learning · continuous collaboration · autonomous UX evolution.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Voice UX Commands (T4-02 / PILLOW-VUC-001)                 │
├─────────────────────────────────────────────────────────────┤
│  Voice UX Command Manager                                   │
│  Voice Input Session Manager                                │
│  Speech-to-Text Adapter                                     │
│  Voice Command Normalizer                                   │
│  Voice UX Intent Parser                                     │
│  Voice Context Mapper (T1 / T2 / T3 linkage)                │
│  Voice Confidence Evaluator                                 │
│  Voice Clarification Engine                                 │
│  Natural UX Conversation Connector (T4-01)                  │
│  Voice Command Metadata Generator                           │
│  Voice Command Validator                                    │
│  Health Monitor · Recovery Manager                          │
└─────────────────────────────────────────────────────────────┘
         ▲
         │ T4-01 Natural UX Conversation
         │ T1 UI State · T2 UX Intelligence · T3 Builder Certification
```

## Safety

- Preserves Grand King control.
- Does **not** apply UX changes automatically.
- Does **not** approve changes automatically.
- Does **not** modify files directly.
- Does **not** log raw audio, secrets, tokens, or private inputs.
- Keeps voice interpretation separate from implementation execution.
- Preserves traceability between voice command, interpreted intent, and future action.

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `VOICE_UX_COMMANDS_ENABLED` | `true` | Enable/disable voice UX commands |
| `VOICE_UX_COMMANDS_STT_PROVIDER` | `local_adapter` | Speech-to-text provider |
| `VOICE_UX_COMMANDS_TRANSCRIPTION_THRESHOLD` | `0.55` | Minimum transcription confidence |
| `VOICE_UX_COMMANDS_MAX_RETRIES` | `3` | Recovery attempts |
| `VOICE_UX_COMMANDS_TIMEOUT_MS` | `120000` | Command timeout |
| `VOICE_UX_COMMANDS_LOG_LEVEL` | `info` | Logging level |
| `VOICE_UX_COMMANDS_AUTO_RECOVER` | `true` | Automatic recovery |

External file: `config/voice-ux-commands.config.json`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/pillow/voice-ux-commands` | Engine state + latest report |
| POST | `/api/pillow/voice-ux-commands/process` | Process a voice UX command |

## Completion Outcome

Voice redesign — hands-free operation. The Grand King can control UX redesign conversation through voice commands while preserving Grand King control.

# EmpireAI Voice Worker

PILLOW-VOW-001 / Q4-10 provides the Voice Worker.

The Voice Worker prepares narration-ready voiceovers for approved media content. It converts approved scripts into production-ready voice assets by coordinating the voice generation workflow. It produces voiceovers as structural signals (asset IDs, paths, descriptors — not binary audio blobs). It does **not** rewrite scripts, assemble videos, or publish media.

## Authority

The Voice Worker:

- operates as an isolated AI Worker within the Media Factory
- receives approved scripts from the Script Worker
- prepares narration segments and voice generation settings
- supports multiple voice profiles and languages
- controls pacing, pronunciation, tone, and emotional style
- generates voiceover asset references and alternate voice versions
- validates voice quality and produces machine-readable Voice Reports
- submits reports through the Executive Reporting Runtime
- operates autonomously under Pillow governance

## Boundaries

The Voice Worker never:

- rewrites scripts
- assembles videos
- publishes media
- overrides Pillow
- overrides Grand King
- implements Q4-11 or later

## Mandatory rules

- Preserve script traceability
- Preserve generated voice asset references
- Preserve voice configuration history
- Validate output quality
- Preserve audit history
- Submit reports through the Executive Reporting Runtime
- Never publish media directly

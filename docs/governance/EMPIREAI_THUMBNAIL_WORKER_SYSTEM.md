# EmpireAI Thumbnail Worker

PILLOW-THW-001 / Q4-07 provides the Thumbnail Worker.

The Thumbnail Worker creates high-performing thumbnail concepts that maximize CTR while remaining truthful. It designs concepts, layouts, and text overlays for downstream image generation and editing. It produces thumbnail specifications. It does **not** publish thumbnails, generate final artwork, or edit images directly.

> Note: Doctrine ID is **PILLOW-THW-001**. Metadata version `THW-001-v1`. Report version `THW-RPT-v1`. Public alias: `ThwThumbnailReport`.

## Boundaries

The Thumbnail Worker:

- **does** receive approved scripts and hooks; generate thumbnail concepts; generate emotional triggers; generate text overlay suggestions; recommend composition and framing; generate multiple A/B thumbnail variants; validate consistency with script content; self-review thumbnail quality; and produce machine-readable Thumbnail Reports
- does **not** generate final artwork
- does **not** edit images directly
- does **not** publish thumbnails
- does **not** implement Q4-08 or later
- does **not** override Pillow or Grand King
- does **not** use misleading or deceptive thumbnails
- operates autonomously under Pillow governance and editor-in-chief strategy

## Thumbnail Report

Each report includes: Thumbnail Report ID, Timestamp, Script ID, Channel ID, Hook Report ID, Topic ID, Content Format, Thumbnail Concepts (with all design elements), Primary Concept, A/B Variants, Text Overlays, Emotional Triggers, Composition Guidance, Script Consistency Status, Branding Notes, Self-Review Summary, Confidence Score (0–100), and Metadata version (`THW-001-v1`).

Complete traceability and audit history are preserved. Self-review is performed before submission. Approved scripts from the Script Worker and hooks from the Hook Worker are preferred inputs.

## Design Elements

Supported design elements (extensible via config): subject_focus, composition, text_overlay, emotional_trigger, contrast, colour_guidance, visual_hierarchy, curiosity_element, branding_consistency.

## Emotional Triggers

Allowed emotional triggers: curiosity, urgency, empathy, triumph, tension, surprise — aligned to script content without clickbait deception.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`)
- Q4-06 Hook Worker (`PILLOW-HKW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Thumbnail reports are submitted through the Executive Reporting Runtime.

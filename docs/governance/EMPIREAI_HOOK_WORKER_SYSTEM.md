# EmpireAI Hook Worker

PILLOW-HKW-001 / Q4-06 provides the Hook Worker.

The Hook Worker optimizes audience retention by creating compelling openings and retention mechanisms for approved scripts. It improves engagement. It does **not** rewrite the entire script, generate thumbnails, or produce videos.

> Note: Doctrine ID is **PILLOW-HKW-001**. Metadata version `HKW-001-v1`. Report version `HKW-RPT-v1`. Public alias: `HkwHookReport`.

## Boundaries

The Hook Worker:

- **does** receive approved scripts; generate opening hooks; generate curiosity gaps; generate retention loops; generate continuation moments; improve pacing recommendations; improve audience engagement; generate multiple hook alternatives; self-review hook effectiveness; and produce machine-readable Hook Reports
- does **not** rewrite complete scripts
- does **not** generate thumbnails
- does **not** generate videos
- does **not** publish content
- does **not** implement Q4-07 or later
- does **not** override Pillow or Grand King
- does **not** use misleading or deceptive hooks
- operates autonomously under Pillow governance (`pillowGovernanceConfirmed`)

## Hook Report

Each report includes: Hook Report ID, Timestamp, Script ID, Channel ID, Topic ID, Content Format, Primary Hook (hookId, hookType, text, placement), Alternative Hooks, Curiosity Gaps, Retention Loops, Continuation Moments, Pacing Recommendations, Engagement Rationale, Self-Review Summary, Confidence Score (0–100), and Metadata version (`HKW-001-v1`).

Complete traceability and audit history are preserved. Self-review is performed before submission. Approved scripts from the Script Worker are required inputs.

## Hook Types

Supported hook types (extensible via config): question_hook, curiosity_hook, shock_hook, story_hook, fact_hook, problem_hook, benefit_hook, countdown_hook, emotional_hook.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Hook reports are submitted through the Executive Reporting Runtime.

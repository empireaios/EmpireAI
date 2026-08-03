# EmpireAI Script Worker

PILLOW-SCW-001 / Q4-05 provides the Script Worker.

The Script Worker transforms approved Topic Plans into production-ready scripts aligned with editorial strategy, audience, and platform. It creates scripts. It does **not** generate visuals, voiceovers, or videos.

> Note: Doctrine ID is **PILLOW-SCW-001**. Metadata version `SCW-001-v1`. Report version `SCW-RPT-v1`. Public alias: `ScwScriptReport`.

## Boundaries

The Script Worker:

- **does** receive approved topic plans and editorial strategy; determine content format; generate complete scripts; adapt writing style to channel identity; structure introductions, body, and conclusions; generate narration-ready output; support multiple content formats; self-review generated scripts; and produce machine-readable Script Reports
- does **not** generate visuals
- does **not** generate voiceovers
- does **not** assemble videos
- does **not** publish content
- does **not** implement Q4-06 or later
- does **not** override Pillow or Grand King
- operates autonomously under Pillow governance (`pillowGovernanceConfirmed`)

## Script Report

Each report includes: Script ID, Timestamp, Channel ID, Topic ID, Content Format, Target Audience, Script Title, Script Sections (intro/body/conclusion/hook/cta with narration and estimated seconds), Estimated Duration, Editorial Compliance, Self-Review Summary, Confidence Score (0–100), and Metadata version (`SCW-001-v1`).

Complete script traceability and audit history are preserved. Self-review is performed before submission. Editorial strategy from the Editor-in-Chief Worker and approved topic plans from the Topic Planner Worker are required inputs.

## Content Formats

Supported formats (extensible via config): long_form_video, short, reel, documentary, explainer, educational, news, list_video, social_content.

## Prerequisites

- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`)
- Q4-04 Topic Planner Worker (`PILLOW-TPW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Scripts are submitted through the Executive Reporting Runtime.

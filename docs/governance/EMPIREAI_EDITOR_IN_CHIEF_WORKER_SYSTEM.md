# EmpireAI Editor-in-Chief Worker

PILLOW-ECW-001 / Q4-02 provides the Editor-in-Chief Worker.

The Editor-in-Chief Worker serves as the executive editorial leader for media businesses managed by EmpireAI. It directs downstream content workers with editorial strategy, channel identity, audience definition, tone, standards, and publishing priorities. It reviews content quality, ensures brand consistency, maintains long-term content strategy, and approves editorial decisions under Pillow governance.

Its responsibility is **editorial direction only**. It does **not** write scripts, create thumbnails, assemble videos, or publish content.

> Note: Doctrine ID is **PILLOW-ECW-001**. Metadata version `ECW-001-v1`. Report version `ECW-RPT-v1`. Public alias: `EcwEditorialReport`.

## Boundaries

The Editor-in-Chief Worker:

- **does** manage editorial direction; define channel identity, target audience, editorial tone, content standards, and publishing priorities; review content quality; ensure brand consistency; maintain long-term content strategy; approve editorial decisions; and produce machine-readable Editorial Reports
- does **not** write scripts
- does **not** create thumbnails
- does **not** assemble videos
- does **not** publish content
- does **not** bypass Pillow governance
- does **not** implement Q4-03 or later
- does **not** override Pillow or Grand King

## Editorial Report

Each report includes: Editorial Report ID, Timestamp, Media Business ID, Channel ID, Editorial Strategy, Target Audience, Editorial Tone, Quality Standards, Content Priorities, Review Outcome, Executive Recommendations, and Metadata version (`ECW-001-v1`).

Editorial consistency, channel identity, audience alignment, and audit history are preserved. Reports are submitted through the Executive Reporting Runtime.

## Prerequisites

- Q4-01 Media Factory Core (`PILLOW-MFC-001`)

## Safety

Complete editorial traceability is preserved. Credentials and authentication tokens are never exposed. Production and publishing actions are never performed. Reports are submitted through the Executive Reporting Runtime.

# EmpireAI Topic Planner Worker

PILLOW-TPW-001 / Q4-04 provides the Topic Planner Worker.

The Topic Planner Worker converts editorial strategy and trend intelligence into executable content plans. It autonomously selects the best publishing topics per approved channel **without** daily Grand King prompts. It plans content. It does **not** create content.

> Note: Doctrine ID is **PILLOW-TPW-001**. Metadata version `TPW-001-v1`. Plan version `TPW-PLAN-v1`. Public alias: `TpwTopicPlan`.

## Boundaries

The Topic Planner Worker:

- **does** receive editorial strategy and trend research reports; analyse channel objectives; prioritize content opportunities; select daily publishing topics; balance evergreen and trending content; prevent duplicate topics; maintain publishing cadence; rank topics by strategic priority; and produce machine-readable Topic Plans
- does **not** write scripts
- does **not** generate visuals
- does **not** produce videos
- does **not** publish content
- does **not** bypass Pillow governance
- does **not** implement Q4-05 or later
- does **not** override Pillow or Grand King
- does **not** require Grand King daily prompts
- operates autonomously under Pillow governance (`pillowGovernanceConfirmed`)

## Topic Plan

Each plan includes: Topic Plan ID, Timestamp, Channel ID, Publishing Date (YYYY-MM-DD), Selected Topics, Topic Priority, Selection Reason, Editorial Alignment, Trend Alignment, Expected Audience, Confidence Score (0–100), and Metadata version (`TPW-001-v1`).

Complete planning traceability and audit history are preserved. Duplicate or conflicting topics are avoided. Editorial strategy from the Editor-in-Chief Worker and trend evidence from the Trend Research Worker are required inputs.

## Prerequisites

- Q4-02 Editor-in-Chief Worker (`PILLOW-ECW-001`)
- Q4-03 Trend Research Worker (`PILLOW-TRW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Plans are submitted through the Executive Reporting Runtime.

# EmpireAI Publishing Worker

PILLOW-PBW-001 / Q4-14 provides the Publishing Worker.

The Publishing Worker prepares platform-specific publishing packages for completed media assets. It generates optimized titles, descriptions, tags, playlists, schedules, and upload packages as structural signals — never binary uploads and never live distribution. It does **not** automatically publish content.

## Authority

The Publishing Worker:

- operates as an isolated AI Worker within the Media Factory
- receives completed media assets from upstream assembly workers
- generates optimized video titles and platform descriptions
- generates tags, keywords, playlists, and publishing schedules
- selects approved thumbnails without modifying approved media assets
- prepares platform-specific upload packages
- validates publishing readiness and approval status before publication readiness
- produces machine-readable Publishing Reports
- submits reports through the Executive Reporting Runtime
- operates autonomously under Pillow governance
- always requires Pillow / Grand King approval before any publish action

## Boundaries

The Publishing Worker never:

- automatically publishes content
- modifies approved media assets
- overrides approval workflows
- overrides Pillow
- overrides Grand King
- bypasses Pillow or Grand King approval
- implements Q4-15 or later

## Mandatory rules

- Preserve complete asset traceability
- Preserve publishing metadata history
- Validate platform requirements
- Validate approval status before publication
- Preserve audit history
- Submit reports through the Executive Reporting Runtime
- Never automatically publish content
- Never bypass Pillow or Grand King approval

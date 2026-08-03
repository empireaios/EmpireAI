# EmpireAI Image & Creative Worker

PILLOW-ICW-001 / Q4-09 provides the Image & Creative Worker.

The Image & Creative Worker transforms approved visual specifications into production-ready creative assets. It creates, edits, and prepares visuals for media production with copyright and licensing respect. It produces creative assets as structural signals (asset IDs, paths, descriptors — not binary blobs). It does **not** assemble videos, generate voiceovers, or publish media.

> Note: Doctrine ID is **PILLOW-ICW-001**. Metadata version `ICW-001-v1`. Report version `ICW-RPT-v1`. Public alias: `IcwCreativeAssetReport`.

## Boundaries

The Image & Creative Worker:

- **does** receive visual research reports and thumbnail specifications; generate original graphics; edit existing images; create diagrams and infographics; create covers and banners; create social media assets; generate multiple creative variants; validate asset quality and compliance; and produce machine-readable Creative Asset Reports
- does **not** assemble videos
- does **not** generate voiceovers
- does **not** publish media
- does **not** implement Q4-10 or later
- does **not** override Pillow or Grand King
- operates autonomously under Pillow governance

## Creative Asset Report

Each report includes: Creative Asset ID, Timestamp, Script ID, Scene ID, Asset Type, Source Assets, Generated Assets, Edit Operations, Quality Status, Copyright Status, Variant Count, Metadata version (`ICW-001-v1`), Channel ID, Visual Research ID, Thumbnail Report ID, Variants, Compliance Notes, Worker ID, Report Version, Traceability Refs, and Preserved Decisions.

Complete asset traceability and audit history are preserved. Original assets are preserved and all edits are recorded. Visual research reports from the Visual Research Worker and thumbnail specifications from the Thumbnail Worker are preferred inputs.

## Creative Asset Types

Supported asset types (extensible via config): thumbnail, cover_image, banner, infographic, diagram, illustration, social_graphic, presentation_graphic, supporting_visual.

## Quality and Copyright

Quality statuses: pass, pass_with_notes, fail, pending_review.

Copyright statuses: original, licensed_derivative, public_domain_derivative, restricted, unknown.

## Prerequisites

- Q4-08 Visual Research Worker (`PILLOW-VRW-001`)
- Q4-07 Thumbnail Worker (`PILLOW-THW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Creative asset reports are submitted through the Executive Reporting Runtime.

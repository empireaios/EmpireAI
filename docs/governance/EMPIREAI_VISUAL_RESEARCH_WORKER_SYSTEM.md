# EmpireAI Visual Research Worker

PILLOW-VRW-001 / Q4-08 provides the Visual Research Worker.

The Visual Research Worker discovers and prepares visual references for media content. It identifies legally usable, contextually relevant visual assets for approved scripts. It prepares visual references. It does **not** assemble videos, generate final creative assets, edit images, or publish.

> Note: Doctrine ID is **PILLOW-VRW-001**. Metadata version `VRW-001-v1`. Report version `VRW-RPT-v1`. Public alias: `VrwVisualResearchReport`.

## Boundaries

The Visual Research Worker:

- **does** receive approved scripts; break scripts into visual scenes; identify required visual assets; search approved stock libraries; search public domain sources; identify internally generated assets; classify copyright status; match visuals to script timeline; detect missing visual coverage; and produce machine-readable Visual Research Reports
- does **not** generate final creative assets
- does **not** edit images
- does **not** assemble videos
- does **not** publish content
- does **not** implement Q4-09 or later
- does **not** override Pillow or Grand King
- uses **only** approved visual sources
- operates autonomously under Pillow governance

## Visual Research Report

Each report includes: Visual Research ID, Timestamp, Script ID, Scene Number (primary), Required Visual, Visual Source, Asset Type, Copyright Status, Usage Rights, Timeline Position, Coverage Status, Confidence Score (0–100), Metadata version (`VRW-001-v1`), Channel ID, Thumbnail Report ID, Scenes array, Missing Assets, Licensing Restrictions, and boundary flags.

Complete asset traceability, copyright information, and audit history are preserved. Approved scripts from the Script Worker and thumbnail context from the Thumbnail Worker are preferred inputs.

## Asset Types

Supported asset types (extensible via config): stock_image, stock_video, public_domain_image, public_domain_video, original_generated_image, original_generated_graphic, diagram, screenshot, archive_material.

## Approved Visual Sources

Stock libraries: shutterstock, getty_images, adobe_stock, pexels, unsplash, pixabay. Public domain archives: wikimedia_commons, library_of_congress, internet_archive. Internal: internal_generated. Unapproved sources are rejected.

## Copyright and Usage

Copyright statuses: licensed_stock, public_domain, original_internal, fair_use_candidate, unknown, restricted. Usage rights: royalty_free, editorial_only, commercial_ok, attribution_required, internal_only, restricted, unknown. Coverage statuses: covered, partial, missing, needs_generation.

## Prerequisites

- Q4-05 Script Worker (`PILLOW-SCW-001`)
- Q4-07 Thumbnail Worker (`PILLOW-THW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Visual research reports are submitted through the Executive Reporting Runtime.

# EmpireAI Prompt Product Worker

PILLOW-PPW-001 / Q5-04 provides the Prompt Product Worker.

The Prompt Product Worker transforms approved Digital Product Research into export-ready prompt products. It receives approved product research, designs prompt architecture, creates prompt libraries and reusable templates, builds AI workflow products, organizes prompts into structured packs, generates user instructions, validates prompt consistency, packages export-ready prompt products (structural signals only), and produces machine-readable Prompt Product Reports. It does **not** build sales pages, process customer payments, deliver products, or publish products directly.

> Note: Doctrine ID is **PILLOW-PPW-001**. Metadata version `PPW-001-v1`. Report version `PPW-RPT-v1`. Public alias: `PpwPromptProductReport`. Worker ID: `wkr-prompt-product-01`. Module ID: `prompt-product-worker`. Factory: `digital-products-factory`. Role: `role-creator-prompt-product`.

## Boundaries

The Prompt Product Worker:

- **does** receive approved digital product research; design prompt architecture; create prompt libraries; create reusable prompt templates; create AI workflow products; organize prompts into structured packs; generate user instructions; validate prompt consistency; package export-ready prompt products; and produce machine-readable Prompt Product Reports
- does **not** build sales pages
- does **not** process customer payments
- does **not** deliver products
- does **not** publish products directly
- does **not** implement Q5-05 or later
- does **not** override Pillow or Grand King
- follows approved product research and approved product intent
- produces original prompt products
- preserves complete traceability and audit history
- validates prompt quality and includes user documentation
- emits structural export signals only

## Prompt Product Report

Each report includes: Prompt Product ID (`ppw-ppt-*`), Timestamp, Product ID (`ppw-prd-*`), Product Title, Target AI Platforms, Prompt Categories, Prompt Library (promptId, title, category, template, variables, platformHints), Workflow Components (componentId, name, description, stepOrder), User Instructions, Quality Review, Export Formats (`markdown`, `json_pack`, `zip_ready`, `notion_ready` — structural signals), Confidence Score, and Metadata version (`PPW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, productType, promptArchitecture, structuredPacks, consistencyValidated, selfReviewPassed, selfReviewFindings, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported product types

Extensible: `prompt_pack`, `prompt_library`, `ai_workflow_system`, `prompt_collection`, `ai_productivity_kit`, `business_prompt_pack`, `creative_prompt_pack`, `technical_prompt_pack`, `unknown`.

## Target AI platforms

Extensible: `chatgpt`, `claude`, `gemini`, `copilot`, `multi_platform`, `unknown`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Prompt Product Reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never actual publication or customer delivery.

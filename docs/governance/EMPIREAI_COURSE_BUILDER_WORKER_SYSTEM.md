# EmpireAI Course Builder Worker

PILLOW-CBW-001 / Q5-05 provides the Course Builder Worker.

The Course Builder Worker transforms approved Digital Product Research into export-ready educational courses. It receives approved product research, designs complete course curriculum, organizes modules, creates lessons, generates quizzes and assessments, generates downloadable resources, creates learning objectives, validates instructional flow (self-review), packages export-ready course assets (structural signals only), and produces machine-readable Course Builder Reports. It does **not** build sales pages, process payments, deliver courses to customers, or publish courses directly.

> Note: Doctrine ID is **PILLOW-CBW-001**. Metadata version `CBW-001-v1`. Report version `CBW-RPT-v1`. Public alias: `CbwCourseBuilderReport`. Worker ID: `wkr-course-builder-01`. Module ID: `course-builder-worker`. Factory: `digital-products-factory`. Role: `role-creator-course-builder`.

## Boundaries

The Course Builder Worker:

- **does** receive approved digital product research; design complete course curriculum; organize modules; create lessons; generate quizzes and assessments; generate downloadable resources; create learning objectives; validate instructional flow; package export-ready course assets; and produce machine-readable Course Builder Reports
- does **not** build sales pages
- does **not** process payments
- does **not** deliver courses to customers
- does **not** publish courses directly
- does **not** implement Q5-06 or later
- does **not** override Pillow or Grand King
- follows approved product research and approved product intent
- produces original course material
- preserves complete traceability and audit history
- validates educational quality and performs self-review before submission
- emits structural export signals only

## Course Builder Report

Each report includes: Course ID (`cbw-crs-*`), Timestamp, Product ID (`cbw-prd-*`), Course Title, Target Audience, Learning Objectives, Module Structure (module number, title, summary, lesson count), Lesson Count, Quiz Count, Resource Count, Quality Review, Export Formats (`markdown`, `scorm_ready`, `zip_ready`, `lms_package_ready` — structural signals), Confidence Score, and Metadata version (`CBW-001-v1`).

Orchestration extras include researchReportId, opportunityId, businessId, factoryMissionId, productType, curriculum, modules (with lessons), lessons, quizzes, resources, instructionalFlowValidated, selfReviewPassed, selfReviewFindings, selfReviewSummary, researchCompliance, workerId, reportVersion, traceabilityRefs, preservedDecisions, executive reporting submission fields, and force-locked boundary flags.

## Supported product types

Extensible: `self_paced_course`, `video_course`, `text_based_course`, `workshop`, `masterclass`, `bootcamp`, `certification_course`, `hybrid_course`, `unknown`.

## Prerequisites

- Q5-01 Digital Products Factory Core (`PILLOW-DPF-001`)
- Q5-02 Digital Product Research Worker (`PILLOW-DPR-001`)
- Q5-03 Ebook Worker (`PILLOW-EBW-001`)
- Q5-04 Prompt Product Worker (`PILLOW-PPW-001`)

## Safety

Credentials and authentication tokens are never exposed. Sensitive enterprise information is never logged. Course Builder Reports are submitted through the Executive Reporting Runtime. Export formats are structural readiness signals only — never actual publication or customer delivery.

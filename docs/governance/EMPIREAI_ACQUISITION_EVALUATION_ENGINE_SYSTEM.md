# EMPIREAI Acquisition Evaluation Engine System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-AEE-001  
> **Mission:** X2-15  
> **Module ID:** `acquisition-evaluation-engine`  
> **Metadata version:** AEE-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Portfolio Performance Engine (X2-03), Capital Distribution Engine (X2-05), Portfolio Risk Engine (X2-07), Business Health Ranking (X2-09), Shared Supplier Intelligence (X2-13), Portfolio Forecast Engine (X2-14)

## Purpose

Acquisition Evaluation Engine discovers and evaluates businesses suitable for acquisition — scoring strategic fit, financial performance, operational maturity, and risk, then ranking opportunities and generating validated recommendations.

## Scope

Strictly limited to acquisition evaluation (X2-15). Does not implement deal execution, legal closing, or later Portfolio Intelligence missions.

## Primary deliverable

Acquisition intelligence.

## Completion outcome

Identify and evaluate businesses suitable for acquisition.

## Capabilities

- Discover acquisition candidates  
- Evaluate opportunities, strategic fit, financial performance, and operational maturity  
- Evaluate acquisition risks and estimate value  
- Rank opportunities and generate recommendations  
- Machine-readable acquisition records (`aee-*`)  
- Status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Acquisition record model

Each record includes: Acquisition Evaluation ID, Timestamp, Candidate business, Industry, Strategic fit score, Financial score, Risk score, Estimated acquisition value, Recommendation, Validation status, Metadata version.

## Safety

- Never expose credentials or authentication tokens  
- Never recommend acquisitions using unvalidated information  
- Never log sensitive enterprise information  
- Preserve evaluation traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — validated information required  

## Runtime

`pillow/src/acquisition-evaluation-engine/`

## Configuration

`config/acquisition-evaluation-engine.config.json` and `ACQUISITION_EVALUATION_ENGINE_*` environment variables.

## APIs

- `GET /api/pillow/acquisition-evaluation-engine`  
- `POST /api/pillow/acquisition-evaluation-engine/connect`  
- `POST /api/pillow/acquisition-evaluation-engine/discover`  
- `POST /api/pillow/acquisition-evaluation-engine/evaluate`  
- `POST /api/pillow/acquisition-evaluation-engine/evaluate-strategic-fit`  
- `POST /api/pillow/acquisition-evaluation-engine/evaluate-financial`  
- `POST /api/pillow/acquisition-evaluation-engine/evaluate-operational`  
- `POST /api/pillow/acquisition-evaluation-engine/evaluate-risks`  
- `POST /api/pillow/acquisition-evaluation-engine/estimate-value`  
- `POST /api/pillow/acquisition-evaluation-engine/rank`  
- `POST /api/pillow/acquisition-evaluation-engine/recommend`  
- `POST /api/pillow/acquisition-evaluation-engine/diagnostics`  

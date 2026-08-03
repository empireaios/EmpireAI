# EMPIREAI Shared Customer Intelligence System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-SCI-001  
> **Mission:** X2-12  
> **Module ID:** `shared-customer-intelligence`  
> **Metadata version:** SCI-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Cross-Business Knowledge Engine (X2-04), Cross-Company Resource Engine (X2-11), Customer Operations (R Series)

## Purpose

Shared Customer Intelligence consolidates enterprise-wide customer knowledge so insights improve every company. It resolves cross-company customer relationships, identifies preferences and behaviour patterns, estimates lifetime value, detects cross-selling opportunities and customer risks, and generates privacy-safe recommendations.

## Scope

Strictly limited to shared customer intelligence (X2-12). Does not implement shared supplier intelligence, forecasting, acquisitions, or later Portfolio Intelligence missions.

## Primary deliverable

Unified customer knowledge.

## Completion outcome

Customer insights improve every company.

## Capabilities

- Consolidate customer knowledge  
- Identify cross-company customer relationships  
- Identify preferences, behaviour patterns, and lifetime value  
- Detect cross-selling opportunities and customer risks  
- Generate customer intelligence recommendations  
- Machine-readable customer intelligence records (`sci-*`)  
- Status, health, and failure reporting  
- Validation, health monitoring, and automatic recovery  

## Customer intelligence record model

Each record includes: Customer Intelligence ID, Timestamp, Customer reference, Associated companies, Customer profile summary, Behaviour summary, Lifetime value estimate, Recommended opportunities, Validation status, Metadata version.

## Safety

- Never expose credentials or authentication tokens  
- Never violate customer privacy policies  
- Never log sensitive customer information  
- Preserve customer traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — privacy-safe records  

## Runtime

`pillow/src/shared-customer-intelligence/`

## Configuration

`config/shared-customer-intelligence.config.json` and `SHARED_CUSTOMER_INTELLIGENCE_*` environment variables.

## APIs

- `GET /api/pillow/shared-customer-intelligence`  
- `POST /api/pillow/shared-customer-intelligence/connect`  
- `POST /api/pillow/shared-customer-intelligence/consolidate`  
- `POST /api/pillow/shared-customer-intelligence/resolve-identity`  
- `POST /api/pillow/shared-customer-intelligence/analyze-behaviour`  
- `POST /api/pillow/shared-customer-intelligence/insights`  
- `POST /api/pillow/shared-customer-intelligence/detect-cross-sell`  
- `POST /api/pillow/shared-customer-intelligence/detect-risks`  
- `POST /api/pillow/shared-customer-intelligence/recommend`  
- `POST /api/pillow/shared-customer-intelligence/diagnostics`  

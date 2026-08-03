# EMPIREAI Cross-Business Knowledge Engine System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-CBK-001  
> **Mission:** X2-04  
> **Module ID:** `cross-business-knowledge-engine`  
> **Metadata version:** CBK-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03)

## Purpose

The Cross-Business Knowledge Engine establishes enterprise-wide knowledge sharing — collecting operational, successful, and failed practices; identifying reusable knowledge; sharing across companies; detecting duplicate learning; building enterprise knowledge assets; ranking usefulness; and generating knowledge recommendations.

## Scope

Strictly limited to cross-business knowledge intelligence (X2-04). Does not implement Capital Distribution, Executive Dashboard, Risk/Balance engines, or later Portfolio Intelligence missions.

## Safety

- Never expose credentials or authentication tokens  
- Never share confidential company information without validation  
- Preserve knowledge traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — sensitive values redacted from logs  

## Runtime

`pillow/src/cross-business-knowledge-engine/`

## Configuration

`config/cross-business-knowledge-engine.config.json` and `CROSS_BUSINESS_KNOWLEDGE_ENGINE_*` environment variables.

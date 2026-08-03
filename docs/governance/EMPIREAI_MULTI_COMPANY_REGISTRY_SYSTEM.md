# EMPIREAI Multi-Company Registry System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-MCR-001  
> **Mission:** X2-02  
> **Module ID:** `multi-company-registry`  
> **Metadata version:** MCR-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01)

## Purpose

The Multi-Company Registry establishes centralized registration and governance of every company within the EmpireAI portfolio — registration, profiles, identities, ownership, lifecycle status, classifications, operational status, duplicate detection, and registry recommendations.

## Scope

Strictly limited to multi-company registration (X2-02). Does not implement Portfolio Performance Engine, Capital Distribution, Executive Dashboard, Risk/Balance engines, or later Portfolio Intelligence missions.

## Safety

- Never expose credentials or authentication tokens  
- Never register duplicate companies without validation  
- Preserve company traceability and auditability  
- Preserve enterprise integrity  
- Structural signals only — sensitive values redacted from logs  

## Runtime

`pillow/src/multi-company-registry/`

## Configuration

`config/multi-company-registry.config.json` and `MULTI_COMPANY_REGISTRY_*` environment variables.

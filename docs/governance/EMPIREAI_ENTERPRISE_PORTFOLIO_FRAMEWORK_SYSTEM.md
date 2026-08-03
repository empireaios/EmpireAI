# EMPIREAI Enterprise Portfolio Framework System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-EPF-001  
> **Mission:** X2-01  
> **Module ID:** `enterprise-portfolio-framework`  
> **Metadata version:** EPF-001-v1  
> **Programme:** Portfolio Intelligence  

## Purpose

The Enterprise Portfolio Framework establishes the reusable multi-company architecture for managing autonomous companies as a single enterprise portfolio — module registration, company registration, portfolio lifecycle, standardized interfaces, event routing, enterprise metadata, validation, diagnostics, health monitoring, and automatic recovery.

## Scope

Strictly limited to the Enterprise Portfolio Framework (X2-01). Does not implement Multi-Company Registry, Portfolio Performance Engine, Capital Distribution, Executive Dashboard, Risk/Balance engines, or later Portfolio Intelligence missions.

## Safety

- Never expose credentials or authentication tokens  
- Never bypass validation  
- Preserve portfolio isolation between registered companies  
- Preserve auditability and recovery capability  
- Structural signals only — sensitive enterprise values redacted from logs  

## Runtime

`pillow/src/enterprise-portfolio-framework/`

## Configuration

`config/enterprise-portfolio-framework.config.json` and `ENTERPRISE_PORTFOLIO_FRAMEWORK_*` environment variables.

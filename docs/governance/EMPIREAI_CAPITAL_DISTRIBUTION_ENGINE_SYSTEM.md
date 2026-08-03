# EMPIREAI Capital Distribution Engine System

> **Classification:** CANONICAL — Portfolio Intelligence Module  
> **Document ID:** PILLOW-CDE-001  
> **Mission:** X2-05  
> **Module ID:** `capital-distribution-engine`  
> **Metadata version:** CDE-001-v1  
> **Programme:** Portfolio Intelligence  
> **Depends on:** Enterprise Portfolio Framework (X2-01), Multi-Company Registry (X2-02), Portfolio Performance Engine (X2-03), Cross-Business Knowledge Engine (X2-04)

## Purpose

The Capital Distribution Engine establishes intelligent portfolio-wide capital allocation — managing capital pools, evaluating funding requirements and investment opportunities, ranking allocation priorities, calculating expected ROI and capital efficiency, detecting shortages and concentration risks, and generating allocation recommendations.

## Scope

Strictly limited to capital distribution (X2-05). Does not implement Executive Dashboard, Risk/Balance engines, or later Portfolio Intelligence missions. Does not execute live bank transfers.

## Safety

- Never expose credentials or authentication tokens  
- Never allocate capital automatically beyond configured approval policies  
- Preserve allocation traceability and auditability  
- Preserve financial integrity  
- Structural capital units only — sensitive financial values redacted from logs  

## Runtime

`pillow/src/capital-distribution-engine/`

## Configuration

`config/capital-distribution-engine.config.json` and `CAPITAL_DISTRIBUTION_ENGINE_*` environment variables.

# EmpireAI Creative Asset Manager System

**Mission ID:** R5-11  
**Status:** Active · Marketing Operations  
**Programme:** Marketing Operations  
**Canonical ID:** PILLOW-CRA-001

## Constitutional Purpose

Implement Creative Asset Manager for EmpireAI. This mission consumes Marketing Framework (R5-01), Campaign Manager (R5-07), and Marketing Analytics Dashboard (R5-10) to establish centralized marketing creative asset management.

**Primary deliverable:** Marketing asset library  
**Completion outcome:** Centralized creative management.

## Scope (R5-11 Only)

Creative asset management · images · videos · documents · advertising creatives · versions · approvals · tags · usage tracking · machine-readable asset records · health monitoring · recovery.

**Out of scope:** Email marketing · SMS marketing · creative intelligence generation · conversion intelligence · budget optimizer · marketing automation · live ad-network creative uploads · binary storage backends.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Creative Asset Manager (R5-11 / PILLOW-CRA-001)            │
├─────────────────────────────────────────────────────────────┤
│  Manager · Library · Version · Classification · Search      │
│  Usage Tracker · Metadata · Validator                       │
│  Health · Recovery                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ R5-01 Marketing Framework
         ├─ R5-07 Campaign Manager
         └─ R5-10 Marketing Analytics Dashboard
```

## Creative Asset Record Model

| Field | Description |
|---|---|
| Asset ID | `cra-asset-*` |
| Timestamp | ISO-8601 |
| Asset name | Display name |
| Asset type | image/video/document/advertising_creative/other |
| Campaign reference | Read-only campaign id |
| Version | Integer version |
| Approval status | draft/pending_approval/approved/rejected |
| Usage status | unused/in_use/archived |
| Validation status | pending/passed/partial/failed |
| Metadata version | `CRA-001-v1` |

## Safety

- Never expose storage credentials or authentication tokens.
- Never overwrite approved creative assets without validation.
- Preserve asset traceability and auditability.
- Preserve creative integrity.

## Configuration

Externalized at `config/creative-asset-manager.config.json` with env overrides (`CREATIVE_ASSET_MANAGER_*`).

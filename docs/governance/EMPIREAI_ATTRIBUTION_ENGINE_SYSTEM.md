# EmpireAI Attribution Engine System

**Mission ID:** R5-09  
**Status:** Active · Marketing Operations  
**Programme:** Marketing Operations  
**Canonical ID:** PILLOW-ATT-001

## Constitutional Purpose

Implement Attribution Engine for EmpireAI. This mission consumes Marketing Framework (R5-01), Meta/Google/TikTok/YouTube Ads (R5-02–R5-05), Campaign Manager (R5-07), and Audience Intelligence (R5-08) to establish unified marketing attribution for accurate ROI measurement.

**Primary deliverable:** Marketing attribution  
**Completion outcome:** Accurate ROI measurement.

## Scope (R5-09 Only)

Acquisition source tracking · touchpoint tracking · conversion journey tracking · campaign/channel/advertisement contribution · multi-model attribution · ROAS · marketing ROI · machine-readable attribution records · health monitoring · recovery.

**Out of scope:** Email marketing · SMS marketing · creative intelligence · conversion intelligence · marketing analytics · budget optimizer · marketing automation · executive marketing dashboard · marketing operations certification · campaign mutation · live ad-network writes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Attribution Engine (R5-09 / PILLOW-ATT-001)                │
├─────────────────────────────────────────────────────────────┤
│  Manager · Touchpoint · Conversion · Multi-Touch            │
│  ROI · Analytics · Metadata · Validator                     │
│  Health · Recovery                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ R5-01 Marketing Framework
         ├─ R5-02…R5-05 Ads Integrations
         ├─ R5-07 Campaign Manager (read-only)
         └─ R5-08 Audience Intelligence
```

## Attribution Record Model

| Field | Description |
|---|---|
| Attribution Record ID | `att-rec-*` |
| Timestamp | ISO-8601 |
| Customer ID | Redacted `cust-ref-*` |
| Campaign reference | Read-only campaign id |
| Marketing channel | Channel enum |
| Touchpoint sequence | Ordered touchpoint ids |
| Attribution model | first/last/linear/time_decay/position_based |
| Attribution value | Attributed conversion share |
| ROI contribution | Contribution toward ROI |
| Validation status | pending/passed/partial/failed |
| Metadata version | `ATT-001-v1` |

## Safety

- Never expose customer credentials or authentication tokens.
- Never modify campaign data automatically.
- Redact customer identifiers in records and logs.
- Preserve attribution traceability and auditability.

## Configuration

Externalized at `config/attribution-engine.config.json` with env overrides (`ATTRIBUTION_ENGINE_*`).

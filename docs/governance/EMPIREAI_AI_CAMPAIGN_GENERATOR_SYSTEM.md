# EmpireAI AI Campaign Generator System

**Mission ID:** R5-12  
**Status:** Active · Marketing Operations  
**Programme:** Marketing Operations  
**Canonical ID:** PILLOW-ACG-001

## Constitutional Purpose

Implement AI Campaign Generator for EmpireAI. This mission consumes Marketing Framework (R5-01), Meta/Google/TikTok/YouTube Ads (R5-02–R5-05), SEO Intelligence (R5-06), Campaign Manager (R5-07), Audience Intelligence (R5-08), Attribution Engine (R5-09), Marketing Analytics Dashboard (R5-10), and Creative Asset Manager (R5-11) to establish autonomous campaign planning powered by Pillow.

**Primary deliverable:** Pillow campaign planning  
**Completion outcome:** AI-generated marketing campaigns.

## Scope (R5-12 Only)

Campaign strategy generation · objectives · channel/audience/budget/schedule/keyword/creative recommendations · campaign summaries · machine-readable AI campaign records · health monitoring · recovery.

**Out of scope:** Email marketing · SMS marketing · creative intelligence generation · conversion intelligence · budget optimizer · marketing automation · automatic campaign publishing · live ad-network writes.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  AI Campaign Generator (R5-12 / PILLOW-ACG-001)             │
├─────────────────────────────────────────────────────────────┤
│  Manager · Strategy · Audience Rec · Budget Rec             │
│  Creative Rec · Planning · Metadata · Validator             │
│  Health · Recovery                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ├─ R5-01 Marketing Framework
         ├─ R5-02…R5-05 Ads Integrations
         ├─ R5-06 SEO Intelligence
         ├─ R5-07 Campaign Manager
         ├─ R5-08 Audience Intelligence
         ├─ R5-09 Attribution Engine
         ├─ R5-10 Marketing Analytics Dashboard
         └─ R5-11 Creative Asset Manager
```

## AI Campaign Record Model

| Field | Description |
|---|---|
| AI Campaign ID | `acg-camp-*` |
| Timestamp | ISO-8601 |
| Campaign objective | awareness/traffic/engagement/leads/conversions/retention |
| Recommended channels | Channel enum list |
| Recommended audience | Audience targeting summary |
| Recommended budget | USD amount |
| Recommended schedule | Start/end/pacing |
| Recommended keywords | Keyword list |
| Recommended creative assets | Asset ids or placeholders |
| Validation status | pending/passed/partial/failed |
| Metadata version | `ACG-001-v1` |

## Safety

- Never expose advertising credentials or authentication tokens.
- Never publish campaigns automatically without validation (`publishReady` remains false).
- Preserve campaign traceability and auditability.
- Preserve marketing integrity.

## Configuration

Externalized at `config/ai-campaign-generator.config.json` with env overrides (`AI_CAMPAIGN_GENERATOR_*`).

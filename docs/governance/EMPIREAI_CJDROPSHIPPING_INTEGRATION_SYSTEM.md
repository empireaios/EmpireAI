# EmpireAI CJdropshipping Integration System

**Mission ID:** R2-02  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-CJ-001

## Constitutional Purpose

Implement CJdropshipping Integration for EmpireAI. This mission consumes the Supplier Framework (R2-01) and enables automated product sourcing through CJdropshipping.

**Primary deliverable:** CJ connector  
**Completion outcome:** Automated product sourcing.

## Scope (R2-02 Only)

CJdropshipping connector registration with Supplier Framework · authentication · API session management · credential validation · connectivity testing · API request/response handling · webhook/event processing · rate-limit handling · retry handling · health monitoring · recovery.

**Out of scope:** AliExpress Integration · 1688 Integration · Supplier Product Sync · Supplier Inventory Sync · Supplier Pricing Engine · live production activation · supplier data modification.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  CJdropshipping Integration (R2-02 / PILLOW-CJ-001)         │
├─────────────────────────────────────────────────────────────┤
│  Connector Manager · Authentication Manager · API Client    │
│  Request Router · Response Handler · Event/Webhook Adapter  │
│  Rate Limit Manager · Retry Manager · Metadata Generator    │
│  Validator · Health Monitor · Recovery Manager              │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supplier Framework (R2-01 / PILLOW-SF-001)                 │
└─────────────────────────────────────────────────────────────┘
```

## CJ Connector Record Model

Each CJdropshipping connector record includes: Connector ID · Supplier ID · Connector version · Authentication status · API session status · Connection status · Supported capabilities · Health status · Validation status · Metadata version.

## Safety

- **Never exposes** CJdropshipping credentials or authentication tokens.
- **Never bypasses** authentication or rate-limit protection.
- **Connector isolation** preserved across all operations.
- **Auditability** of all connector operations maintained.

## Configuration

Externalized via `config/cj-dropshipping-integration.config.json` and environment variables (`CJDROPSHIPPING_INTEGRATION_*`).

## Supported Capabilities

- `cj_authentication`
- `cj_connection_testing`
- `api_request_routing`
- `api_response_normalization`
- `webhook_event_handling`
- `rate_limit_handling`
- `retry_handling`
- `connector_health_monitoring`
- `diagnostics`
- `recovery`

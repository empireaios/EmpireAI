# EmpireAI Shipping Carrier Integration System

**Mission ID:** R2-11  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-SCI-001

## Constitutional Purpose

Implement Shipping Carrier Integration for EmpireAI. This mission consumes Fulfilment Orchestrator (R2-10) and establishes standardized integration with supported shipping carriers.

**Primary deliverable:** Carrier connectivity  
**Completion outcome:** Multi-carrier shipping.

## Scope (R2-11 Only)

Registering carriers · authenticating with carrier APIs · managing sessions · validating credentials · creating shipment requests · requesting labels and rates · receiving confirmations and status updates · handling rate limits and retries · machine-readable shipment records · status and health reporting.

**Out of scope:** Live production activation · shipments without validation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Shipping Carrier Integration (R2-11 / PILLOW-SCI-001)      │
├─────────────────────────────────────────────────────────────┤
│  Carrier Manager · Registry · Authentication Manager          │
│  API Client · Shipping Request Engine · Label Engine            │
│  Response Handler · Metadata Generator · Carrier Validator      │
│  Health Monitor · Recovery Manager                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Fulfilment Orchestrator (R2-10 / PILLOW-FO-001)            │
└─────────────────────────────────────────────────────────────┘
```

## Shipment Record Model

Each record includes: Shipment ID · Timestamp · Carrier ID · Carrier name · Order reference · Fulfilment reference · Shipment request ID · Shipping label reference · Shipment status · Validation status · Metadata version.

## Safety

- **Never exposes** carrier credentials or authentication tokens.
- **Never creates** shipments without validation.
- **Shipment traceability** and auditability preserved.

## Configuration

Externalized via `config/shipping-carrier-integration.config.json` and environment variables (`SHIPPING_CARRIER_INTEGRATION_*`).

## Supported Carriers

- `usps` — United States Postal Service
- `ups` — United Parcel Service
- `fedex` — FedEx
- `dhl` — DHL Express

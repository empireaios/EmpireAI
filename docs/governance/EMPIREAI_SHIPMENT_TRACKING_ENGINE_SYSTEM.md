# EmpireAI Shipment Tracking Engine System

**Mission ID:** R2-12  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-STE-001

## Constitutional Purpose

Implement Shipment Tracking Engine for EmpireAI. This mission consumes Shipping Carrier Integration (R2-11) and establishes live shipment visibility across supported carriers.

**Primary deliverable:** Live tracking  
**Completion outcome:** Shipment visibility.

## Scope (R2-12 Only)

Receiving shipment records · receiving carrier tracking numbers · querying carrier tracking APIs · receiving tracking webhook events · tracking shipment status · tracking shipment location · tracking delivery milestones · detecting delayed shipments · detecting failed deliveries · detecting delivered shipments · producing machine-readable tracking records · reporting shipment tracking status · reporting shipment tracking health · reporting shipment tracking failures.

**Out of scope:** Carrier registration · shipment creation · label generation · rate quoting.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Shipment Tracking Engine (R2-12 / PILLOW-STE-001)          │
├─────────────────────────────────────────────────────────────┤
│  Shipment Tracking Manager · Carrier Tracking Adapter         │
│  Tracking Event Processor · Shipment Status Mapper            │
│  Delivery Milestone Engine · Delay Detection Engine           │
│  Tracking Metadata Generator · Tracking Validator             │
│  Health Monitor · Recovery Manager                            │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Shipping Carrier Integration (R2-11 / PILLOW-SCI-001)      │
└─────────────────────────────────────────────────────────────┘
```

## Shipment Tracking Record Model

Each record includes: Tracking Record ID · Timestamp · Shipment ID · Carrier ID · Tracking number · Order reference · Fulfilment reference · Current shipment status · Current location · Delivery milestone · Estimated delivery date · Delivered timestamp · Delay status · Validation status · Metadata version.

## Safety

- **Never exposes** carrier credentials or authentication tokens.
- **Never overwrites** shipment status without validation.
- **Shipment traceability** and auditability preserved.
- **Tracking integrity** preserved across restarts and partial failures.

## Configuration

Externalized via `config/shipment-tracking-engine.config.json` and environment variables (`SHIPMENT_TRACKING_ENGINE_*`).

## Supported Carriers

- `usps` — United States Postal Service
- `ups` — United Parcel Service
- `fedex` — FedEx
- `dhl` — DHL Express

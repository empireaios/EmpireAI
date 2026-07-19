# EmpireAI Return Management System

**Mission ID:** R2-13  
**Status:** Active · Supplier & Fulfilment  
**Programme:** Supplier & Fulfilment (Real World Operations)  
**Canonical ID:** PILLOW-RM-001

## Constitutional Purpose

Implement Return Management for EmpireAI. This mission consumes Shipment Tracking Engine (R2-12) and establishes automated return processing across supported suppliers and shipping carriers.

**Primary deliverable:** Return processing  
**Completion outcome:** Automated returns.

## Scope (R2-13 Only)

Creating return requests · validating return eligibility · receiving customer return requests · coordinating supplier return workflows · coordinating carrier return shipments · generating return shipping labels · tracking return lifecycle · tracking returned inventory · detecting return failures · producing machine-readable return records · reporting return status · reporting return health · reporting return failures.

**Out of scope:** Order creation · shipment creation · live production activation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Return Management (R2-13 / PILLOW-RM-001)                  │
├─────────────────────────────────────────────────────────────┤
│  Return Management Manager · Return Request Engine            │
│  Return Validation Engine · Supplier Return Coordinator       │
│  Carrier Return Coordinator · Return Label Generator          │
│  Return Status Tracker · Return Metadata Generator            │
│  Return Validator · Health Monitor · Recovery Manager         │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Shipment Tracking Engine (R2-12 / PILLOW-STE-001)          │
└─────────────────────────────────────────────────────────────┘
```

## Return Record Model

Each record includes: Return ID · Timestamp · Order reference · Shipment reference · Customer reference · Supplier reference · Return reason · Return authorization status · Return shipment status · Return completion status · Validation status · Metadata version.

## Safety

- **Never exposes** supplier credentials or authentication tokens.
- **Never approves** invalid return requests.
- **Return traceability** and auditability preserved.
- **Return integrity** preserved across restarts and interrupted workflows.

## Configuration

Externalized via `config/return-management.config.json` and environment variables (`RETURN_MANAGEMENT_*`).

## Supported Suppliers

- `cj` — CJ Dropshipping
- `aliexpress` — AliExpress
- `1688` — 1688.com

## Supported Carriers

- `usps` — United States Postal Service
- `ups` — United Parcel Service
- `fedex` — FedEx
- `dhl` — DHL Express

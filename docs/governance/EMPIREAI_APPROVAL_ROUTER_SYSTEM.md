# EmpireAI Approval Router System

PILLOW-AR-001 / Q0-06 provides the Approval Router for Pillow.

The Approval Router is the authoritative executive governance service that determines whether an action can proceed autonomously or must be routed for Pillow or Grand King approval. It manages approval requirements and workflow state. It does not approve or execute requests.

## Boundaries

Approval Router:

- **does** determine approval requirements, generate approval requests, track approval status, and block unauthorized execution
- does **not** approve requests
- does **not** execute requests
- does **not** assign workers
- does **not** override Pillow
- does **not** override Grand King

## Approval Request

Each request includes: Approval ID, Timestamp, Request ID, Related Business, Related Mission, Request Summary, Requested Action, Approval Level, Reason Approval Is Required, Risk Assessment, Expected Impact, Current Status, Approval History, and Metadata version (`AR-001-v1`).

## Approval levels

autonomous, pillow_approval, grand_king_approval, multi_stage_approval

## Approval states

pending, approved, rejected, cancelled, expired, escalated

## Safety

Credentials and authentication tokens are never exposed. Approval routing preserves auditability and traceability. External outcomes may be recorded for status tracking; the router itself never grants approval authority.

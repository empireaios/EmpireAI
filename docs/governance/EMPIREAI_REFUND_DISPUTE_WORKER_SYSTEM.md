# EmpireAI Refund & Dispute Worker

PILLOW-RDW-001 / Q3-12 provides the Refund & Dispute Worker.

The Refund & Dispute Worker manages all post-order exception workflows involving refunds, returns, customer disputes and support cases.

Its responsibility is **refund and dispute workflow management only**. It classifies cases, validates requests against EmpireAI policies and marketplace rules, tracks case status, coordinates with suppliers when required, generates customer communications, escalates cases beyond delegated authority, and records final outcomes. It does **not** authorize actions outside the Authority Matrix.

> Note: Doctrine ID is **PILLOW-RDW-001**. Metadata version `RDW-001-v1`. Report version `RDW-RPT-v1`. Public alias: `RdwRefundDisputeReport`.

## Boundaries

The Refund & Dispute Worker:

- **does** receive refund, return, and dispute requests; classify case types; validate against policies; track case status; coordinate with suppliers when required; generate customer communications; escalate exceptional cases; record final outcomes; and produce machine-readable Refund & Dispute Reports
- does **not** modify financial ledgers directly
- does **not** override marketplace policies
- does **not** authorize actions outside the Authority Matrix
- does **not** implement Q3-13 or later
- does **not** override Pillow or Grand King

## Refund & Dispute Report

Each report includes: Case ID, Timestamp, Order ID, Customer ID, Supplier ID, Case Type, Reason, Policy Evaluation, Current Status, Actions Taken, Customer Communications, Resolution, Escalation Status, and Metadata version (`RDW-001-v1`).

Complete case and customer communication history is preserved. Supplier references are retained. Cases beyond delegated authority escalate to Pillow. Audit history is retained.

## Case Types

Minimum supported types: Refund, Return, Exchange, Supplier Issue, Shipping Issue, Damaged Product, Missing Item, Customer Dispute, Chargeback, General Support.

Architecture supports future case types beyond this minimum set.

## Prerequisites

- Q3-11 Order Worker (`PILLOW-ORW-001`)

## Safety

Case and supplier traceability are preserved. Credentials and authentication tokens are never exposed. Financial ledgers are never modified directly. Reports are submitted through the Executive Reporting Runtime.

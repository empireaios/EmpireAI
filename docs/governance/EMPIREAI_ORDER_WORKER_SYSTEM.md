# EmpireAI Order Worker

PILLOW-ORW-001 / Q3-11 provides the Order Worker.

The Order Worker manages the complete operational lifecycle of customer orders.

Its responsibility is **order operations only**. It coordinates order routing, monitors fulfilment and shipment progress, detects exceptions, generates customer status updates, and escalates critical issues to Pillow. It does **not** process customer payments.

> Note: Doctrine ID is **PILLOW-ORW-001**. Metadata version `ORW-001-v1`. Report version `ORW-RPT-v1`. Public alias: `OrwOrderReport`.

## Boundaries

The Order Worker:

- **does** receive confirmed customer orders; route orders to suppliers; track fulfilment and shipment status; detect fulfilment exceptions, delayed orders, and failed fulfilment; generate customer status updates; escalate critical order issues; maintain complete order history; and produce machine-readable Order Reports
- does **not** process payments
- does **not** issue refunds
- does **not** modify inventory directly
- does **not** alter financial records
- does **not** implement Q3-12 or later
- does **not** override Pillow or Grand King

## Order Report

Each report includes: Order Report ID, Timestamp, Order ID, Customer ID, Product ID, Supplier ID, Order Status, Fulfilment Status, Shipping Status, Exceptions, Customer Updates, Recommended Action, and Metadata version (`ORW-001-v1`).

Complete order and fulfilment history is preserved. Supplier references are retained. Operational exceptions are detected. Audit history is retained.

## Order States

Minimum supported states: Received, Awaiting Fulfilment, Processing, Fulfilled, Shipped, Delivered, Delayed, Exception, Cancelled, Closed.

Architecture supports future order states beyond this minimum set.

## Prerequisites

- Q3-10 Inventory Worker (`PILLOW-INW-001`)

## Safety

Order and supplier traceability are preserved. Credentials and authentication tokens are never exposed. Financial records are never altered. Reports are submitted through the Executive Reporting Runtime.

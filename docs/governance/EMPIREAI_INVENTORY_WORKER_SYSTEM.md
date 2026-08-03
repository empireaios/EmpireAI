# EmpireAI Inventory Worker

PILLOW-INW-001 / Q3-10 provides the Inventory Worker.

The Inventory Worker continuously monitors product inventory readiness across suppliers and connected commerce channels.

Its responsibility is **inventory monitoring only**. It tracks stock quantities, lead times, reorder points, supplier availability, and inventory alerts. It does **not** purchase inventory or modify supplier stock.

> Note: Doctrine ID is **PILLOW-INW-001**. Metadata version `INW-001-v1`. Report version `INW-RPT-v1`. Public alias: `InwInventoryReport`.

## Boundaries

The Inventory Worker:

- **does** receive approved products; monitor supplier stock availability, inventory quantities, lead times, and supplier availability; calculate reorder points; detect low-stock, out-of-stock, and abnormal inventory changes; generate inventory alerts; and produce machine-readable Inventory Reports
- does **not** purchase inventory
- does **not** modify supplier stock
- does **not** place supplier orders
- does **not** modify supplier inventory directly
- does **not** implement Q3-11 or later
- does **not** override Pillow or Grand King

## Inventory Report

Each report includes: Inventory Report ID, Timestamp, Product ID, Supplier ID, Current Stock, Stock Status, Lead Time, Reorder Point, Supplier Availability, Inventory Alerts, Recommended Action, Confidence Score, and Metadata version (`INW-001-v1`).

Inventory and supplier references are preserved. Critical inventory events generate alerts. Audit history is retained.

## Stock Status

- **in_stock** — current stock is above the reorder point
- **low_stock** — current stock is at or below the reorder point
- **out_of_stock** — current stock is zero or below
- **unknown** — insufficient data to classify stock

## Prerequisites

- Q3-05 Supplier Evaluation Worker (`PILLOW-SEW-001`)
- Q3-09 Pricing Worker (`PILLOW-PRW-001`)

## Safety

Inventory traceability and supplier references are preserved. Credentials and authentication tokens are never exposed. Supplier inventory is never modified directly. Reports are submitted through the Executive Reporting Runtime.

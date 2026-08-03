# EmpireAI Supplier Discovery Worker

PILLOW-SDW-001 / Q3-04 provides the Supplier Discovery Worker.

The Supplier Discovery Worker discovers suppliers capable of fulfilling approved products by searching approved supplier platforms and integrated supplier APIs.

Its responsibility is **supplier discovery only**. It produces standardized Supplier Discovery Reports for downstream workers.

> Note: Doctrine ID is **PILLOW-SDW-001**. Metadata version `SDW-001-v1`. Report version `SDW-RPT-v1`. Public alias: `SdwSupplierDiscoveryReport`.

## Boundaries

The Supplier Discovery Worker:

- **does** receive approved products, search approved platforms and APIs, discover multiple supplier candidates, capture product/pricing/MOQ/shipping/location information, preserve source references, and produce machine-readable Supplier Discovery Reports
- does **not** evaluate suppliers
- does **not** negotiate suppliers
- does **not** select suppliers
- does **not** place orders
- does **not** modify supplier data
- does **not** implement Q3-05 or later
- does **not** override Pillow or Grand King

## Supplier Discovery Report

Each report includes: Discovery ID, Timestamp, Product ID, Product Name, Supplier ID, Supplier Name, Supplier Platform, Product Cost, MOQ, Shipping Availability, Supplier Location, Source Reference, Confidence Score, and Metadata version (`SDW-001-v1`).

Unavailable information is distinguished from missing information via `fieldAvailability`.

## Approved sources

Default platforms: alibaba, aliexpress, cjdropshipping, spocket, local_wholesale.

Default APIs: alibaba_open_api, cj_dropshipping_api, spocket_api, internal_supplier_catalog_api.

Additional approved sources can be registered through configuration without redesign.

## Prerequisites

- Q3-03 Product Evaluation Worker (`PILLOW-PEW-001`)

## Safety

Credentials and authentication tokens are never exposed. Discoveries preserve supplier and evaluation traceability and audit history. Sensitive values are masked in logs.

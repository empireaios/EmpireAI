# EmpireAI Product Discovery Worker

PILLOW-PDW-001 / Q3-02 provides the Product Discovery Worker.

The Product Discovery Worker continuously discovers products with commercial potential from approved marketplaces, supplier platforms, search demand, trend signals, and customer demand.

Its responsibility is **discovery only**. It produces candidate products for downstream workers.

> Note: Doctrine ID is **PILLOW-PDW-001**. Metadata version `PDW-001-v1`. Report version `PDW-RPT-v1`. Public alias: `PdwProductDiscoveryReport`. Distinct from the backend `product-discovery-opportunity-engine`.

## Boundaries

The Product Discovery Worker:

- **does** discover products from approved sources, aggregate discovery signals, categorize candidates, remove duplicates, score confidence, and produce machine-readable Product Discovery Reports
- does **not** evaluate products
- does **not** rank products
- does **not** select suppliers
- does **not** build listings
- does **not** implement Q3-03 or later
- does **not** override Pillow or Grand King

## Product Discovery Report

Each report includes: Discovery ID, Timestamp, Business Mission ID, Product ID, Product Name, Category, Discovery Source, Marketplace, Supplier, Search Trend Signals, Customer Demand Signals, Discovery Reason, Confidence Score, Supporting Evidence, and Metadata version (`PDW-001-v1`).

## Approved sources

Default marketplaces: amazon, shopify, etsy, walmart, ebay, tiktok_shop.

Default supplier platforms: alibaba, aliexpress, cjdropshipping, spocket, local_wholesale.

Additional approved sources can be registered through configuration without redesign.

## Prerequisites

- Q3-01 Commerce Factory Core (`PILLOW-CMF-001`)

## Safety

Credentials and authentication tokens are never exposed. Discoveries preserve source traceability and audit history. Facts are distinguished from assumptions. Sensitive values are masked in logs.

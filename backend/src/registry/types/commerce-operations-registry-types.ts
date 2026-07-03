/**
 * G7-02 — Commerce operations registry type schemas.
 */

import { z } from "zod";

export const COMMERCE_OPERATIONS_REGISTRY_VERSION = "g7-02-v1" as const;

export const COMMERCE_OPERATION_STATES = [
  "not_ready",
  "ready",
  "starting",
  "running",
  "paused",
  "degraded",
  "blocked",
  "incident",
  "stopping",
  "stopped",
  "completed",
] as const;

export type CommerceOperationState = (typeof COMMERCE_OPERATION_STATES)[number];

export const COMMERCE_OPERATION_TYPES = [
  "marketplace_sales",
  "supplier_sync",
  "catalog_sync",
  "order_sync",
  "inventory_sync",
  "payment_processing",
  "refund_processing",
  "shipment_tracking",
  "analytics_collection",
  "future_operation_type",
] as const;

export type CommerceOperationType = (typeof COMMERCE_OPERATION_TYPES)[number];

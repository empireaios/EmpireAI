/** PILLOW-AMZO-001 — Amazon Order Management types (R1-04). */

import type {
  CANCELLATION_STATUSES,
  ENGINE_STATUSES,
  FULFILMENT_STATUSES,
  HEALTH_STATUSES,
  LIFECYCLE_EVENT_TYPES,
  ORDER_STATUSES,
  REFUND_STATUSES,
  SHIPPING_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AmazonOrderManagementConfiguration } from "./configuration.js";

export type AmazonOrderManagementEngineVersion = "PILLOW-AMZO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];
export type ShippingStatus = (typeof SHIPPING_STATUSES)[number];
export type RefundStatus = (typeof REFUND_STATUSES)[number];
export type CancellationStatus = (typeof CANCELLATION_STATUSES)[number];
export type LifecycleEventType = (typeof LIFECYCLE_EVENT_TYPES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AmazonOrderItem = {
  asin: string;
  sku: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
};

export type AmazonOrderRecord = {
  orderId: string;
  amazonOrderId: string;
  marketplaceId: string;
  orderTimestamp: string;
  buyerReference: string | null;
  orderStatus: OrderStatus;
  orderItems: AmazonOrderItem[];
  quantity: number;
  price: number;
  currency: string;
  fulfilmentStatus: FulfilmentStatus;
  shippingStatus: ShippingStatus | null;
  refundStatus: RefundStatus | null;
  cancellationStatus: CancellationStatus | null;
  sourceApiReference: string;
  metadataVersion: string;
  lastSyncedAt: string;
};

export type AmazonOrderChangeSet = {
  newOrders: AmazonOrderRecord[];
  updatedOrders: AmazonOrderRecord[];
  cancelledOrders: AmazonOrderRecord[];
  fulfilledOrders: AmazonOrderRecord[];
  refundedOrders: AmazonOrderRecord[];
  unchangedCount: number;
};

export type AmazonOrderLifecycleEvent = {
  eventId: string;
  eventType: LifecycleEventType;
  amazonOrderId: string;
  timestamp: string;
  details: string;
};

export type AmazonOrderValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AmazonOrderSyncReport = {
  syncReportId: string;
  syncTimestamp: string;
  action: "sync" | "fetch" | "process_event" | "track_status";
  orders: AmazonOrderRecord[];
  changes: AmazonOrderChangeSet;
  events: AmazonOrderLifecycleEvent[];
  validation: AmazonOrderValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AmazonOrderHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  orderCount: number;
  lastSyncAt: string | null;
  lastValidationDecision: AmazonOrderValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  syncFailures: number;
  notes: string[];
};

export type AmazonOrderPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  syncRuns: number;
  ordersFetched: number;
  ordersSynced: number;
  newOrdersDetected: number;
  updatedOrdersDetected: number;
  cancelledOrdersDetected: number;
  fulfilledOrdersDetected: number;
  refundedOrdersDetected: number;
  lifecycleEventsProcessed: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type AmazonOrderLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AmazonOrderManagementState = {
  engineVersion: AmazonOrderManagementEngineVersion;
  missionId: "R1-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: AmazonOrderManagementConfiguration;
  latestReport: AmazonOrderSyncReport | null;
  orders: AmazonOrderRecord[];
  health: AmazonOrderHealthReport;
  performance: AmazonOrderPerformanceStats;
};

export type AmazonOrderCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  orderCount: number;
  lastSyncAt: string | null;
  lastDecision: AmazonOrderValidationReport["decision"] | null;
  newOrdersDetected: number;
  cancelledOrdersDetected: number;
  fulfilledOrdersDetected: number;
  recentLogs: string[];
};

export type SyncAmazonOrdersInput = {
  forceFullSync?: boolean;
  region?: "na" | "fe" | "eu";
};

export type FetchAmazonOrderInput = {
  amazonOrderId: string;
  region?: "na" | "fe" | "eu";
};

export type ProcessAmazonOrderEventInput = {
  eventType: LifecycleEventType;
  amazonOrderId: string;
  payloadRef: string;
};

export type RawAmazonOrderPayload = {
  amazonOrderId: string;
  orderTimestamp: string;
  buyerReference?: string;
  orderStatus: OrderStatus;
  items: AmazonOrderItem[];
  price: number;
  currency: string;
  fulfilmentStatus: FulfilmentStatus;
  shippingStatus?: ShippingStatus;
  refundStatus?: RefundStatus;
  cancellationStatus?: CancellationStatus;
};

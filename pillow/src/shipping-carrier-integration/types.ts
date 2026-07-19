/** PILLOW-SCI-001 — Shipping Carrier Integration types (R2-11). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  SHIPMENT_STATUSES,
  SUPPORTED_CARRIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ShippingCarrierIntegrationConfiguration } from "./configuration.js";

export type ShippingCarrierIntegrationVersion = "PILLOW-SCI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type ShipmentStatus = (typeof SHIPMENT_STATUSES)[number];
export type SupportedCarrierIdentifier = (typeof SUPPORTED_CARRIER_IDENTIFIERS)[number];

export type CarrierRegistration = {
  carrierId: SupportedCarrierIdentifier;
  carrierName: string;
  registeredAt: string;
  authenticated: boolean;
  sessionId: string | null;
};

export type ShipmentRecord = {
  shipmentId: string;
  timestamp: string;
  carrierId: SupportedCarrierIdentifier;
  carrierName: string;
  orderReference: string;
  fulfilmentReference: string;
  shipmentRequestId: string;
  shippingLabelReference: string | null;
  shipmentStatus: ShipmentStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type ShippingRateQuote = {
  quoteId: string;
  carrierId: SupportedCarrierIdentifier;
  rate: number;
  currency: string;
  estimatedDays: number;
};

export type CarrierFailureFinding = {
  shipmentId: string;
  failureType: "authentication" | "api_failure" | "shipment_creation" | "label_generation" | "rate_limit";
  details: string;
};

export type InvalidShipmentFinding = {
  orderReference: string;
  errors: string[];
};

export type CarrierValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ShipmentReport = {
  shipmentReportId: string;
  shipmentTimestamp: string;
  action: "register" | "create" | "label" | "rate" | "confirm" | "status_update";
  records: ShipmentRecord[];
  rates: ShippingRateQuote[];
  failures: CarrierFailureFinding[];
  invalidRequests: InvalidShipmentFinding[];
  validation: CarrierValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CarrierHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  shipmentCount: number;
  registeredCarriers: number;
  lastShipmentAt: string | null;
  lastValidationDecision: CarrierValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  carrierFailures: number;
  labelsGenerated: number;
  invalidRequestsDetected: number;
  notes: string[];
};

export type CarrierPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  shipmentRequests: number;
  labelsGenerated: number;
  ratesRequested: number;
  carriersRegistered: number;
  carrierFailures: number;
  invalidRequestsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CarrierLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ShippingCarrierIntegrationState = {
  engineVersion: ShippingCarrierIntegrationVersion;
  missionId: "R2-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: ShippingCarrierIntegrationConfiguration;
  latestReport: ShipmentReport | null;
  records: ShipmentRecord[];
  carriers: CarrierRegistration[];
  health: CarrierHealthReport;
  performance: CarrierPerformanceStats;
};

export type CarrierCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  shipmentCount: number;
  registeredCarriers: number;
  lastShipmentAt: string | null;
  lastDecision: CarrierValidationReport["decision"] | null;
  labelsGenerated: number;
  carrierFailures: number;
  recentLogs: string[];
};

export type RegisterCarrierInput = {
  carrierId?: SupportedCarrierIdentifier;
  registerAllSupported?: boolean;
};

export type CreateShipmentRequestInput = {
  carrierId?: SupportedCarrierIdentifier;
  orderReference?: string;
  fulfilmentReference?: string;
  includeFixtureShipment?: boolean;
};

export type RequestShippingLabelInput = {
  shipmentId: string;
};

export type RequestShippingRatesInput = {
  carrierId?: SupportedCarrierIdentifier;
  orderReference?: string;
};

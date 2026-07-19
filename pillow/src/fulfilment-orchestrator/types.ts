/** PILLOW-FO-001 — Fulfilment Orchestrator types (R2-10). */

import type {
  ENGINE_STATUSES,
  FAILURE_STATUSES,
  FULFILMENT_ROUTES,
  FULFILMENT_STATUSES,
  HEALTH_STATUSES,
  SUPPORTED_SUPPLIER_IDENTIFIERS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { FulfilmentOrchestratorConfiguration } from "./configuration.js";

export type FulfilmentOrchestratorVersion = "PILLOW-FO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type FulfilmentStatus = (typeof FULFILMENT_STATUSES)[number];
export type FailureStatus = (typeof FAILURE_STATUSES)[number];
export type FulfilmentRoute = (typeof FULFILMENT_ROUTES)[number];
export type SupportedSupplierIdentifier = (typeof SUPPORTED_SUPPLIER_IDENTIFIERS)[number];

export type FulfilmentRecord = {
  fulfilmentId: string;
  timestamp: string;
  orderReference: string;
  procurementReference: string;
  supplierId: string;
  productReference: string;
  quantity: number;
  selectedFulfilmentRoute: FulfilmentRoute;
  fulfilmentStatus: FulfilmentStatus;
  failureStatus: FailureStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type RouteSelectionResult = {
  selectionId: string;
  fulfilmentRoute: FulfilmentRoute;
  supplierId: string;
  selectionReason: string;
};

export type FulfilmentFailureFinding = {
  fulfilmentId: string;
  failureType: FailureStatus;
  details: string;
};

export type InvalidFulfilmentFinding = {
  orderReference: string;
  errors: string[];
};

export type FulfilmentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type FulfilmentReport = {
  fulfilmentReportId: string;
  fulfilmentTimestamp: string;
  action: "route" | "track" | "coordinate" | "validate";
  records: FulfilmentRecord[];
  routeSelection: RouteSelectionResult | null;
  failures: FulfilmentFailureFinding[];
  invalidRequests: InvalidFulfilmentFinding[];
  validation: FulfilmentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FulfilmentHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  fulfilmentCount: number;
  lastRoutingAt: string | null;
  lastValidationDecision: FulfilmentValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  routingFailures: number;
  blockedWorkflows: number;
  fulfilledCount: number;
  invalidRequestsDetected: number;
  notes: string[];
};

export type FulfilmentPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  routingRuns: number;
  ordersRouted: number;
  fulfilmentsCompleted: number;
  blockedWorkflowsDetected: number;
  routingFailures: number;
  invalidRequestsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type FulfilmentLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type FulfilmentOrchestratorState = {
  engineVersion: FulfilmentOrchestratorVersion;
  missionId: "R2-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: FulfilmentOrchestratorConfiguration;
  latestReport: FulfilmentReport | null;
  records: FulfilmentRecord[];
  health: FulfilmentHealthReport;
  performance: FulfilmentPerformanceStats;
};

export type FulfilmentCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  fulfilmentCount: number;
  lastRoutingAt: string | null;
  lastDecision: FulfilmentValidationReport["decision"] | null;
  fulfilledCount: number;
  blockedWorkflows: number;
  routingFailures: number;
  recentLogs: string[];
};

export type RouteFulfilmentInput = {
  orderReference?: string;
  procurementReference?: string;
  productReference?: string;
  quantity?: number;
  includeFixtureFulfilment?: boolean;
};

export type ReceiveFulfilmentRequirementsInput = {
  orderReference: string;
  procurementReference: string;
  productReference: string;
  quantity: number;
};

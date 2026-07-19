/** PILLOW-MWS-001 — Multi-Warehouse Support types (R2-15). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  INVENTORY_TRANSFER_STATUSES,
  VALIDATION_STATUSES,
  WAREHOUSE_HEALTH_STATUSES,
  WAREHOUSE_IDENTIFIERS,
} from "./paths.js";
import type { MultiWarehouseSupportConfiguration } from "./configuration.js";

export type MultiWarehouseSupportVersion = "PILLOW-MWS-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type WarehouseIdentifier = (typeof WAREHOUSE_IDENTIFIERS)[number];
export type InventoryTransferStatus = (typeof INVENTORY_TRANSFER_STATUSES)[number];
export type WarehouseHealthStatus = (typeof WAREHOUSE_HEALTH_STATUSES)[number];

export type WarehouseNetworkRecord = {
  warehouseNetworkId: string;
  timestamp: string;
  warehouseId: WarehouseIdentifier;
  warehouseLocation: string;
  inventoryAllocation: number;
  availableCapacity: number;
  assignedFulfilmentWorkload: number;
  inventoryTransferStatus: InventoryTransferStatus;
  warehouseHealthStatus: WarehouseHealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type WarehouseNetworkFailureFinding = {
  warehouseNetworkId: string;
  failureType:
    | "missing_warehouse"
    | "transfer_failure"
    | "communication_failure"
    | "capacity_failure"
    | "synchronization_failure"
    | "selection_failure";
  details: string;
};

export type InvalidWarehouseNetworkFinding = {
  warehouseId: string;
  errors: string[];
};

export type WarehouseNetworkValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WarehouseNetworkReport = {
  networkReportId: string;
  networkTimestamp: string;
  action: "register" | "select" | "transfer" | "route" | "sync" | "analyze";
  records: WarehouseNetworkRecord[];
  failures: WarehouseNetworkFailureFinding[];
  invalidRecords: InvalidWarehouseNetworkFinding[];
  validation: WarehouseNetworkValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WarehouseNetworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  warehouseCount: number;
  lastNetworkSyncAt: string | null;
  lastValidationDecision: WarehouseNetworkValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  networkFailures: number;
  imbalancedCount: number;
  capacityIssueCount: number;
  transfersCompleted: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type WarehouseNetworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  registrationRuns: number;
  warehousesRegistered: number;
  selectionsPerformed: number;
  transfersInitiated: number;
  transfersCompleted: number;
  fulfilmentRoutes: number;
  imbalancedDetected: number;
  capacityIssuesDetected: number;
  networkFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WarehouseNetworkLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MultiWarehouseSupportState = {
  engineVersion: MultiWarehouseSupportVersion;
  missionId: "R2-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: MultiWarehouseSupportConfiguration;
  latestReport: WarehouseNetworkReport | null;
  records: WarehouseNetworkRecord[];
  health: WarehouseNetworkHealthReport;
  performance: WarehouseNetworkPerformanceStats;
};

export type WarehouseNetworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  warehouseCount: number;
  lastNetworkSyncAt: string | null;
  lastDecision: WarehouseNetworkValidationReport["decision"] | null;
  imbalancedCount: number;
  capacityIssueCount: number;
  transfersCompleted: number;
  recentLogs: string[];
};

export type RegisterWarehousesInput = {
  warehouseIds?: WarehouseIdentifier[];
  includeFixtureWarehouses?: boolean;
  networkFixtureMode?: "none" | "balanced" | "imbalanced" | "capacity_issue";
};

export type SelectWarehouseInput = {
  orderReference?: string;
  productReference?: string;
  quantity?: number;
  preferredWarehouseId?: WarehouseIdentifier;
};

export type TransferInventoryInput = {
  sourceWarehouseId: WarehouseIdentifier;
  targetWarehouseId: WarehouseIdentifier;
  quantity: number;
  transferFixtureMode?: "none" | "completed" | "failed";
};

export type RouteFulfilmentInput = {
  orderReference: string;
  sourceWarehouseId?: WarehouseIdentifier;
  targetWarehouseId: WarehouseIdentifier;
};

/** PILLOW-WI-001 — Warehouse Intelligence types (R2-14). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
  WAREHOUSE_IDENTIFIERS,
  WAREHOUSE_STATUSES,
} from "./paths.js";
import type { WarehouseIntelligenceConfiguration } from "./configuration.js";

export type WarehouseIntelligenceVersion = "PILLOW-WI-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type WarehouseIdentifier = (typeof WAREHOUSE_IDENTIFIERS)[number];
export type WarehouseStatus = (typeof WAREHOUSE_STATUSES)[number];

export type WarehouseRecord = {
  warehouseRecordId: string;
  timestamp: string;
  warehouseId: WarehouseIdentifier;
  warehouseLocation: string;
  inventoryLevel: number;
  capacityUtilization: number;
  availableCapacity: number;
  assignedInventory: number;
  fulfilmentWorkload: number;
  warehouseStatus: WarehouseStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type WarehouseFailureFinding = {
  warehouseRecordId: string;
  failureType:
    | "missing_warehouse"
    | "invalid_inventory"
    | "allocation_failure"
    | "capacity_failure"
    | "synchronization_failure";
  details: string;
};

export type InvalidWarehouseFinding = {
  warehouseId: string;
  errors: string[];
};

export type WarehouseValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WarehouseReport = {
  warehouseReportId: string;
  warehouseTimestamp: string;
  action: "coordinate" | "allocate" | "distribute" | "analyze" | "optimize";
  records: WarehouseRecord[];
  failures: WarehouseFailureFinding[];
  invalidRecords: InvalidWarehouseFinding[];
  validation: WarehouseValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WarehouseHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  warehouseCount: number;
  lastCoordinationAt: string | null;
  lastValidationDecision: WarehouseValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  warehouseFailures: number;
  bottleneckCount: number;
  shortageCount: number;
  overstockCount: number;
  invalidRecordsDetected: number;
  notes: string[];
};

export type WarehousePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  coordinationRuns: number;
  warehousesCoordinated: number;
  allocationsPerformed: number;
  distributionsOptimized: number;
  bottlenecksDetected: number;
  shortagesDetected: number;
  overstockDetected: number;
  warehouseFailures: number;
  invalidRecordsDetected: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WarehouseLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type WarehouseIntelligenceState = {
  engineVersion: WarehouseIntelligenceVersion;
  missionId: "R2-14";
  status: EngineStatus;
  initializedAt: string;
  configuration: WarehouseIntelligenceConfiguration;
  latestReport: WarehouseReport | null;
  records: WarehouseRecord[];
  health: WarehouseHealthReport;
  performance: WarehousePerformanceStats;
};

export type WarehouseCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  warehouseCount: number;
  lastCoordinationAt: string | null;
  lastDecision: WarehouseValidationReport["decision"] | null;
  bottleneckCount: number;
  shortageCount: number;
  overstockCount: number;
  recentLogs: string[];
};

export type CoordinateWarehousesInput = {
  warehouseId?: WarehouseIdentifier;
  includeFixtureWarehouses?: boolean;
  warehouseFixtureMode?: "none" | "optimal" | "bottleneck" | "shortage" | "overstock";
};

export type AllocateWarehouseInput = {
  orderReference?: string;
  productReference?: string;
  quantity?: number;
};

export type OptimizeInventoryDistributionInput = {
  warehouseId?: WarehouseIdentifier;
};

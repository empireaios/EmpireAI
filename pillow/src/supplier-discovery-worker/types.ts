import type { SupplierDiscoveryWorkerConfiguration } from "./configuration.js";
import type {
  APPROVED_SUPPLIER_APIS,
  APPROVED_SUPPLIER_PLATFORMS,
  DISCOVERY_CHANNELS,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INFORMATION_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  SDW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ApprovedSupplierPlatform = (typeof APPROVED_SUPPLIER_PLATFORMS)[number] | string;
export type ApprovedSupplierApi = (typeof APPROVED_SUPPLIER_APIS)[number] | string;
export type DiscoveryChannel = (typeof DISCOVERY_CHANNELS)[number] | string;
export type InformationStatus = (typeof INFORMATION_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SupplierDiscoveryWorkerCapability = (typeof SDW_CAPABILITIES)[number];

/** Compact approved product input from Q3-03 (read-only). */
export type ApprovedProductInput = {
  evaluationId?: string | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  recommendation?: string | null;
  overallScore?: number | null;
  discoveryId?: string | null;
  businessMissionId?: string | null;
};

export type SupplierCandidateInput = {
  supplierId?: string | null;
  supplierName?: string | null;
  supplierPlatform?: string | null;
  supplierApi?: string | null;
  productCost?: number | null;
  moq?: number | null;
  shippingAvailability?: string | null;
  supplierLocation?: string | null;
  sourceReference?: string | null;
  productSku?: string | null;
};

/** Field availability tracking — distinguishes unavailable vs missing. */
export type FieldAvailability = {
  productCost: InformationStatus;
  moq: InformationStatus;
  shippingAvailability: InformationStatus;
  supplierLocation: InformationStatus;
};

/** Machine-readable Supplier Discovery Report (Q3-04) — one supplier candidate. */
export type SupplierDiscoveryReport = {
  discoveryId: string;
  timestamp: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  supplierPlatform: string;
  productCost: number | null;
  moq: number | null;
  shippingAvailability: string | null;
  supplierLocation: string | null;
  sourceReference: string;
  confidenceScore: number;
  discoveryChannel: DiscoveryChannel;
  supplierApi: string | null;
  productSku: string | null;
  fieldAvailability: FieldAvailability;
  evaluationId: string | null;
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverEvaluateSuppliers: true;
  neverNegotiateSuppliers: true;
  neverSelectSuppliers: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ305OrLater: true;
  neverModifySupplierData: true;
  preserveSupplierTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SupplierDiscoveryWorkerInput = {
  discoveryId?: string | null;
  approvedProduct?: ApprovedProductInput | null;
  approvedProducts?: ApprovedProductInput[] | null;
  evaluationId?: string | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  supplierCandidates?: SupplierCandidateInput[] | null;
  platformCandidates?: SupplierCandidateInput[] | null;
  apiCandidates?: SupplierCandidateInput[] | null;
  approvedSupplierPlatforms?: string[] | null;
  approvedSupplierApis?: string[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  evaluateSuppliers?: boolean;
  negotiateSuppliers?: boolean;
  selectSuppliers?: boolean;
  placeOrders?: boolean;
  modifySupplierData?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ305OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SupplierDiscoveryWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierDiscoveryWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SDW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SupplierDiscoveryWorkerCapability[];
  totalDiscoveries: number;
  lastSupplierPlatform: string | null;
  lastDiscoveryId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SupplierDiscoveryWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  discoveries: SupplierDiscoveryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverEvaluateSuppliers: true;
  neverNegotiateSuppliers: true;
  neverSelectSuppliers: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SupplierDiscoveryWorkerRunReport = {
  supplierDiscoveryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_products"
    | "search_platforms"
    | "search_apis"
    | "discover_candidates"
    | "capture_product_information"
    | "capture_pricing"
    | "capture_moq"
    | "capture_shipping"
    | "capture_location"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SupplierDiscoveryWorkerEngineRecord;
  catalog: SupplierDiscoveryWorkerCatalog | null;
  discoveries: SupplierDiscoveryReport[];
  latestDiscovery: SupplierDiscoveryReport | null;
  integrations: IntegrationHandshake[];
  validation: SupplierDiscoveryWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierDiscoveryWorkerState = {
  engineVersion: "PILLOW-SDW-001";
  missionId: "Q3-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierDiscoveryWorkerConfiguration;
  latestReport: SupplierDiscoveryWorkerRunReport | null;
  engineRecord: SupplierDiscoveryWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalDiscoveries: number;
    lastDiscoveryId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type SupplierDiscoveryWorkerCockpitSnapshot = {
  missionId: "Q3-04";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalDiscoveries: number;
  latestDiscoveryId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverEvaluateSuppliers: true;
  neverNegotiateSuppliers: true;
  neverSelectSuppliers: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

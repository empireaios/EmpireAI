import type { ProductDiscoveryWorkerConfiguration } from "./configuration.js";
import type {
  APPROVED_MARKETPLACES,
  APPROVED_SUPPLIER_PLATFORMS,
  DISCOVERY_SOURCES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PDW_CAPABILITIES,
  PRODUCT_CATEGORIES,
  TREND_DIRECTIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type DiscoverySource = (typeof DISCOVERY_SOURCES)[number] | string;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number] | string;
export type TrendDirection = (typeof TREND_DIRECTIONS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ProductDiscoveryWorkerCapability = (typeof PDW_CAPABILITIES)[number];
export type ApprovedMarketplace = (typeof APPROVED_MARKETPLACES)[number] | string;
export type ApprovedSupplierPlatform = (typeof APPROVED_SUPPLIER_PLATFORMS)[number] | string;

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Machine-readable Product Discovery Report (Q3-02) — one candidate product. */
export type ProductDiscoveryReport = {
  discoveryId: string;
  timestamp: string;
  businessMissionId: string;
  productId: string;
  productName: string;
  category: ProductCategory;
  discoverySource: DiscoverySource;
  marketplace: string | null;
  supplier: string | null;
  searchTrendSignals: string[];
  customerDemandSignals: string[];
  discoveryReason: string;
  confidenceScore: number;
  supportingEvidence: EvidenceItem[];
  trendDirection: TrendDirection;
  seasonalTag: string | null;
  isDuplicateOf: string | null;
  facts: string[];
  assumptions: string[];
  metadataVersion: string;
  reportVersion: string;
  commerceBuildMissionId: string | null;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverEvaluateProducts: true;
  neverRankProducts: true;
  neverSelectSuppliers: true;
  neverBuildListings: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ303OrLater: true;
  preserveSourceTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type MarketplaceCandidateInput = {
  productName?: string | null;
  productId?: string | null;
  marketplace?: string | null;
  category?: string | null;
  signals?: string[] | null;
  reason?: string | null;
};

export type SupplierCandidateInput = {
  productName?: string | null;
  productId?: string | null;
  supplier?: string | null;
  category?: string | null;
  signals?: string[] | null;
  reason?: string | null;
};

export type ProductDiscoveryWorkerInput = {
  discoveryId?: string | null;
  businessMissionId?: string | null;
  commerceBuildMissionId?: string | null;
  productName?: string | null;
  productId?: string | null;
  category?: string | null;
  discoverySource?: string | null;
  marketplace?: string | null;
  supplier?: string | null;
  marketplaceCandidates?: MarketplaceCandidateInput[] | null;
  supplierCandidates?: SupplierCandidateInput[] | null;
  searchTrendSignals?: string[] | null;
  customerDemandSignals?: string[] | null;
  seasonalSignals?: string[] | null;
  emergingTrendSignals?: string[] | null;
  decliningProductSignals?: string[] | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  approvedMarketplaces?: string[] | null;
  approvedSupplierPlatforms?: string[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  evaluateProducts?: boolean;
  rankProducts?: boolean;
  selectSuppliers?: boolean;
  buildListings?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ303OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ProductDiscoveryWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductDiscoveryWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PDW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ProductDiscoveryWorkerCapability[];
  totalDiscoveries: number;
  lastCategory: ProductCategory | null;
  lastDiscoveryId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ProductDiscoveryWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  discoveries: ProductDiscoveryReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverEvaluateProducts: true;
  neverRankProducts: true;
  neverSelectSuppliers: true;
  neverBuildListings: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ProductDiscoveryWorkerRunReport = {
  discoveryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "discover_marketplaces"
    | "discover_suppliers"
    | "discover_search_trends"
    | "discover_customer_demand"
    | "discover_seasonal"
    | "detect_emerging_trends"
    | "detect_declining_products"
    | "categorize_products"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ProductDiscoveryWorkerEngineRecord;
  catalog: ProductDiscoveryWorkerCatalog | null;
  discoveries: ProductDiscoveryReport[];
  latestDiscovery: ProductDiscoveryReport | null;
  integrations: IntegrationHandshake[];
  validation: ProductDiscoveryWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProductDiscoveryWorkerState = {
  engineVersion: "PILLOW-PDW-001";
  missionId: "Q3-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductDiscoveryWorkerConfiguration;
  latestReport: ProductDiscoveryWorkerRunReport | null;
  engineRecord: ProductDiscoveryWorkerEngineRecord | null;
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

export type ProductDiscoveryWorkerCockpitSnapshot = {
  missionId: "Q3-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalDiscoveries: number;
  latestDiscoveryId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverEvaluateProducts: true;
  neverRankProducts: true;
  neverSelectSuppliers: true;
  neverBuildListings: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

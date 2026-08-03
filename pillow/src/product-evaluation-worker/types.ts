import type { ProductEvaluationWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  PEW_CAPABILITIES,
  RECOMMENDATIONS,
  SCORE_DIMENSIONS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type EvaluationRecommendation = (typeof RECOMMENDATIONS)[number];
export type ScoreDimension = (typeof SCORE_DIMENSIONS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ProductEvaluationWorkerCapability = (typeof PEW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Compact discovered product input from Q3-02 (read-only). */
export type DiscoveredProductInput = {
  discoveryId?: string | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  discoverySource?: string | null;
  marketplace?: string | null;
  supplier?: string | null;
  searchTrendSignals?: string[] | null;
  customerDemandSignals?: string[] | null;
  discoveryReason?: string | null;
  confidenceScore?: number | null;
  trendDirection?: string | null;
  businessMissionId?: string | null;
  supportingEvidence?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
};

/** Machine-readable Product Evaluation Report (Q3-03). */
export type ProductEvaluationReport = {
  evaluationId: string;
  timestamp: string;
  productId: string;
  productName: string;
  category: string;
  discoveryId: string | null;
  businessMissionId: string | null;
  marginScore: number;
  demandScore: number;
  competitionScore: number;
  shippingScore: number;
  riskScore: number;
  reviewScore: number;
  creativePotentialScore: number;
  overallScore: number;
  recommendation: EvaluationRecommendation;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  facts: string[];
  assumptions: string[];
  scoreNotes: Record<ScoreDimension, string>;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverDiscoverProducts: true;
  neverSelectSuppliers: true;
  neverCreateListings: true;
  neverPurchaseInventory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ304OrLater: true;
  preserveDiscoveryTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ProductEvaluationWorkerInput = {
  evaluationId?: string | null;
  discoveredProduct?: DiscoveredProductInput | null;
  discoveredProducts?: DiscoveredProductInput[] | null;
  discoveryId?: string | null;
  productId?: string | null;
  productName?: string | null;
  category?: string | null;
  /** Optional explicit dimension score overrides (0–100). */
  marginHint?: number | null;
  demandHint?: number | null;
  competitionHint?: number | null;
  shippingHint?: number | null;
  riskHint?: number | null;
  reviewHint?: number | null;
  creativePotentialHint?: number | null;
  estimatedCost?: number | null;
  estimatedPrice?: number | null;
  shippingWeightKg?: number | null;
  competitorCount?: number | null;
  averageReviewRating?: number | null;
  reviewCount?: number | null;
  creativeAssetsAvailable?: boolean | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  discoverProducts?: boolean;
  selectSuppliers?: boolean;
  createListings?: boolean;
  purchaseInventory?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ304OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ProductEvaluationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProductEvaluationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-PEW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ProductEvaluationWorkerCapability[];
  totalEvaluations: number;
  lastRecommendation: EvaluationRecommendation | null;
  lastEvaluationId: string | null;
  lastOverallScore: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ProductEvaluationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  evaluations: ProductEvaluationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverDiscoverProducts: true;
  neverSelectSuppliers: true;
  neverCreateListings: true;
  neverPurchaseInventory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ProductEvaluationWorkerRunReport = {
  evaluationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_discovered_products"
    | "score_margin"
    | "score_demand"
    | "score_competition"
    | "score_shipping"
    | "score_risk"
    | "score_reviews"
    | "score_creative_potential"
    | "generate_overall_score"
    | "recommend"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ProductEvaluationWorkerEngineRecord;
  catalog: ProductEvaluationWorkerCatalog | null;
  evaluations: ProductEvaluationReport[];
  latestEvaluation: ProductEvaluationReport | null;
  integrations: IntegrationHandshake[];
  validation: ProductEvaluationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProductEvaluationWorkerState = {
  engineVersion: "PILLOW-PEW-001";
  missionId: "Q3-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: ProductEvaluationWorkerConfiguration;
  latestReport: ProductEvaluationWorkerRunReport | null;
  engineRecord: ProductEvaluationWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalEvaluations: number;
    lastEvaluationId: string | null;
    lastOverallScore: number | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type ProductEvaluationWorkerCockpitSnapshot = {
  missionId: "Q3-03";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEvaluations: number;
  latestEvaluationId: string | null;
  lastOverallScore: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverDiscoverProducts: true;
  neverSelectSuppliers: true;
  neverCreateListings: true;
  neverPurchaseInventory: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

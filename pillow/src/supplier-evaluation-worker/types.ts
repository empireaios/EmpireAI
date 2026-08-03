import type { SupplierEvaluationWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RECOMMENDATIONS,
  SCORE_DIMENSIONS,
  SEW_CAPABILITIES,
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
export type SupplierEvaluationWorkerCapability = (typeof SEW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Compact supplier discovery input from Q3-04 (read-only). */
export type DiscoveredSupplierInput = {
  discoveryId?: string | null;
  productId?: string | null;
  productName?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  supplierPlatform?: string | null;
  productCost?: number | null;
  moq?: number | null;
  shippingAvailability?: string | null;
  supplierLocation?: string | null;
  sourceReference?: string | null;
  confidenceScore?: number | null;
  discoveryChannel?: string | null;
  supplierApi?: string | null;
  evaluationId?: string | null;
  businessMissionId?: string | null;
  fieldAvailability?: {
    productCost?: string;
    moq?: string;
    shippingAvailability?: string;
    supplierLocation?: string;
  } | null;
};

/** Machine-readable Supplier Evaluation Report (Q3-05). */
export type SupplierEvaluationReport = {
  evaluationId: string;
  timestamp: string;
  supplierId: string;
  supplierName: string;
  productId: string;
  productName: string;
  discoveryId: string | null;
  reliabilityScore: number;
  priceScore: number;
  shippingScore: number;
  refundPolicyScore: number;
  fulfilmentQualityScore: number;
  communicationScore: number;
  riskScore: number;
  overallScore: number;
  recommendation: EvaluationRecommendation;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  facts: string[];
  assumptions: string[];
  scoreNotes: Record<ScoreDimension, string>;
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverDiscoverSuppliers: true;
  neverNegotiateSuppliers: true;
  neverPlaceSupplierOrders: true;
  neverModifySupplierInformation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ306OrLater: true;
  preserveDiscoveryTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SupplierEvaluationWorkerInput = {
  evaluationId?: string | null;
  discoveredSupplier?: DiscoveredSupplierInput | null;
  discoveredSuppliers?: DiscoveredSupplierInput[] | null;
  discoveryId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  productId?: string | null;
  productName?: string | null;
  reliabilityHint?: number | null;
  priceHint?: number | null;
  shippingHint?: number | null;
  refundPolicyHint?: number | null;
  fulfilmentQualityHint?: number | null;
  communicationHint?: number | null;
  riskHint?: number | null;
  refundPolicyDays?: number | null;
  onTimeDeliveryRate?: number | null;
  responseTimeHours?: number | null;
  defectRate?: number | null;
  yearsInBusiness?: number | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  discoverSuppliers?: boolean;
  negotiateSuppliers?: boolean;
  placeSupplierOrders?: boolean;
  modifySupplierInformation?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ306OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SupplierEvaluationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierEvaluationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SEW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SupplierEvaluationWorkerCapability[];
  totalEvaluations: number;
  lastRecommendation: EvaluationRecommendation | null;
  lastEvaluationId: string | null;
  lastOverallScore: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SupplierEvaluationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  evaluations: SupplierEvaluationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverDiscoverSuppliers: true;
  neverNegotiateSuppliers: true;
  neverPlaceSupplierOrders: true;
  neverModifySupplierInformation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SupplierEvaluationWorkerRunReport = {
  evaluationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_discovery_reports"
    | "evaluate_reliability"
    | "evaluate_pricing"
    | "evaluate_shipping"
    | "evaluate_refund_policy"
    | "evaluate_fulfilment_quality"
    | "evaluate_communication"
    | "evaluate_risk"
    | "generate_overall_score"
    | "recommend"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SupplierEvaluationWorkerEngineRecord;
  catalog: SupplierEvaluationWorkerCatalog | null;
  evaluations: SupplierEvaluationReport[];
  latestEvaluation: SupplierEvaluationReport | null;
  integrations: IntegrationHandshake[];
  validation: SupplierEvaluationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierEvaluationWorkerState = {
  engineVersion: "PILLOW-SEW-001";
  missionId: "Q3-05";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierEvaluationWorkerConfiguration;
  latestReport: SupplierEvaluationWorkerRunReport | null;
  engineRecord: SupplierEvaluationWorkerEngineRecord | null;
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

export type SupplierEvaluationWorkerCockpitSnapshot = {
  missionId: "Q3-05";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalEvaluations: number;
  latestEvaluationId: string | null;
  lastOverallScore: number | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverDiscoverSuppliers: true;
  neverNegotiateSuppliers: true;
  neverPlaceSupplierOrders: true;
  neverModifySupplierInformation: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

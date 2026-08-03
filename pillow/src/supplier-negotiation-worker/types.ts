import type { SupplierNegotiationWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  EVIDENCE_KINDS,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  RECOMMENDATIONS,
  SNW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type NegotiationRecommendation = (typeof RECOMMENDATIONS)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type SupplierNegotiationWorkerCapability = (typeof SNW_CAPABILITIES)[number];

export type EvidenceItem = {
  evidenceId: string;
  source: string;
  claim: string;
  kind: EvidenceKind;
  relatedTopic: string;
  recordedAt: string;
};

/** Compact supplier evaluation input from Q3-05 (read-only). */
export type EvaluatedSupplierInput = {
  evaluationId?: string | null;
  discoveryId?: string | null;
  supplierId?: string | null;
  supplierName?: string | null;
  productId?: string | null;
  productName?: string | null;
  reliabilityScore?: number | null;
  priceScore?: number | null;
  shippingScore?: number | null;
  refundPolicyScore?: number | null;
  fulfilmentQualityScore?: number | null;
  communicationScore?: number | null;
  riskScore?: number | null;
  overallScore?: number | null;
  recommendation?: string | null;
  confidenceScore?: number | null;
  businessMissionId?: string | null;
  productCost?: number | null;
  moq?: number | null;
  shippingAvailability?: string | null;
  supplierLocation?: string | null;
  supplierPlatform?: string | null;
};

export type CandidateSupplierSummary = {
  supplierId: string;
  supplierName: string;
  evaluationId: string | null;
  discoveryId: string | null;
  overallScore: number;
  evaluationRecommendation: string | null;
  strengths: string[];
  weaknesses: string[];
};

export type NegotiationTopicBlock = {
  topic: string;
  opportunities: string[];
  questions: string[];
  targetOutcome: string;
};

/** Machine-readable Supplier Negotiation Report (Q3-06). */
export type SupplierNegotiationReport = {
  negotiationId: string;
  timestamp: string;
  productId: string;
  productName: string;
  candidateSuppliers: CandidateSupplierSummary[];
  preferredSupplier: CandidateSupplierSummary | null;
  comparisonSummary: string;
  negotiationOpportunities: string[];
  moqNegotiation: NegotiationTopicBlock;
  priceNegotiation: NegotiationTopicBlock;
  shippingNegotiation: NegotiationTopicBlock;
  fulfilmentQuestions: NegotiationTopicBlock;
  refundQuestions: NegotiationTopicBlock;
  draftNegotiationMessage: string;
  recommendation: NegotiationRecommendation;
  supportingEvidence: EvidenceItem[];
  confidenceScore: number;
  evaluationIds: string[];
  businessMissionId: string | null;
  metadataVersion: string;
  reportVersion: string;
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  workerId: string;
  neverContactSuppliers: true;
  neverCommitAgreements: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ307OrLater: true;
  preserveSupplierTraceability: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type SupplierNegotiationWorkerInput = {
  negotiationId?: string | null;
  evaluatedSupplier?: EvaluatedSupplierInput | null;
  evaluatedSuppliers?: EvaluatedSupplierInput[] | null;
  evaluationId?: string | null;
  productId?: string | null;
  productName?: string | null;
  targetMoq?: number | null;
  targetUnitPrice?: number | null;
  preferredShippingTerms?: string | null;
  evidenceSources?: Array<{
    source?: string | null;
    claim?: string | null;
    kind?: EvidenceKind | string | null;
    relatedTopic?: string | null;
  }> | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  contactSuppliers?: boolean;
  commitAgreements?: boolean;
  placeOrders?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ307OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type SupplierNegotiationWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type SupplierNegotiationWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-SNW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: SupplierNegotiationWorkerCapability[];
  totalNegotiations: number;
  lastRecommendation: NegotiationRecommendation | null;
  lastNegotiationId: string | null;
  lastPreferredSupplierId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type SupplierNegotiationWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  negotiations: SupplierNegotiationReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverContactSuppliers: true;
  neverCommitAgreements: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type SupplierNegotiationWorkerRunReport = {
  negotiationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_evaluation_reports"
    | "compare_suppliers"
    | "identify_opportunities"
    | "prepare_moq_questions"
    | "prepare_pricing_questions"
    | "prepare_shipping_terms"
    | "prepare_fulfilment_questions"
    | "prepare_refund_questions"
    | "prepare_draft_message"
    | "recommend_preferred"
    | "produce_report"
    | "submit_findings"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: SupplierNegotiationWorkerEngineRecord;
  catalog: SupplierNegotiationWorkerCatalog | null;
  negotiations: SupplierNegotiationReport[];
  latestNegotiation: SupplierNegotiationReport | null;
  integrations: IntegrationHandshake[];
  validation: SupplierNegotiationWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type SupplierNegotiationWorkerState = {
  engineVersion: "PILLOW-SNW-001";
  missionId: "Q3-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierNegotiationWorkerConfiguration;
  latestReport: SupplierNegotiationWorkerRunReport | null;
  engineRecord: SupplierNegotiationWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalNegotiations: number;
    lastNegotiationId: string | null;
    lastPreferredSupplierId: string | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type SupplierNegotiationWorkerCockpitSnapshot = {
  missionId: "Q3-06";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalNegotiations: number;
  latestNegotiationId: string | null;
  lastPreferredSupplierId: string | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverContactSuppliers: true;
  neverCommitAgreements: true;
  neverPlaceOrders: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

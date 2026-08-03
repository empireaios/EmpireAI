import type { OpportunityScannerConfiguration } from "./configuration.js";
import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  OPPORTUNITY_CATEGORIES,
  OSC_CAPABILITIES,
  REVIEW_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type OpportunityCategory = (typeof OPPORTUNITY_CATEGORIES)[number];
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];
export type OpportunityScannerCapability = (typeof OSC_CAPABILITIES)[number];

export type OpportunityScannerInput = {
  domains?: string[];
  categoryFocus?: OpportunityCategory | "all";
  signalHints?: string[];
  maxOpportunities?: number;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  executeOpportunities?: boolean;
  approveOpportunities?: boolean;
  assignWorkers?: boolean;
  createBusinesses?: boolean;
};

export type OpportunityScores = {
  relevanceScore: number;
  profitPotentialScore: number;
  feasibilityScore: number;
  confidenceScore: number;
  riskScore: number;
};

/** Machine-readable opportunity record for Pillow review. */
export type OpportunityRecord = {
  opportunityId: string;
  timestamp: string;
  opportunityCategory: OpportunityCategory;
  sourceSignal: string;
  summary: string;
  businessValueHypothesis: string;
  feasibilityScore: number;
  profitPotentialScore: number;
  riskScore: number;
  confidenceScore: number;
  relevanceScore: number;
  recommendedNextStep: string;
  reviewStatus: ReviewStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  opportunityTraceId: string;
  domain: string;
  /** Explicit Q0-02 boundaries. */
  neverExecuteOpportunities: true;
  neverApproveOpportunities: true;
  neverAssignWorkers: true;
  neverCreateBusinesses: true;
  opportunityExecuted: false;
  opportunityApproved: false;
  workersAssigned: false;
  businessCreated: false;
  preserveOpportunityTraceability: true;
  preserveAuditability: true;
  preserveScanningIntegrity: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type OpportunityValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityScannerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-OSC-001";
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: OpportunityScannerCapability[];
  configuredDomains: string[];
  totalOpportunities: number;
  pendingReviewCount: number;
  metadataVersion: string;
};

export type OpportunityScannerRunReport = {
  scannerRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "configure_domains"
    | "scan_business"
    | "scan_operational"
    | "scan_all"
    | "score_opportunities"
    | "mark_for_review"
    | "validate_opportunities"
    | "diagnostics";
  engineRecord: OpportunityScannerEngineRecord;
  opportunities: OpportunityRecord[];
  validation: OpportunityValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type OpportunityScannerState = {
  engineVersion: "PILLOW-OSC-001";
  missionId: "Q0-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: OpportunityScannerConfiguration;
  latestReport: OpportunityScannerRunReport | null;
  engineRecord: OpportunityScannerEngineRecord | null;
  health: {
    status: HealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalOpportunities: number;
    pendingReviewCount: number;
    notes: string[];
  };
};

export type OpportunityScannerCockpitSnapshot = {
  missionId: "Q0-02";
  status: EngineStatus;
  healthStatus: HealthStatus;
  totalOpportunities: number;
  pendingReviewCount: number;
  configuredDomains: string[];
  neverExecuteOpportunities: true;
  neverApproveOpportunities: true;
  neverAssignWorkers: true;
  neverCreateBusinesses: true;
};

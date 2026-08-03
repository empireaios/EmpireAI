import type { RequirementsWorkerConfiguration } from "./configuration.js";
import type {
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  REQUIREMENT_TYPES,
  RESEARCH_COMPLIANCE_LEVELS,
  RQW_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type RequirementType = (typeof REQUIREMENT_TYPES)[number];
export type ResearchComplianceLevel = (typeof RESEARCH_COMPLIANCE_LEVELS)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type RequirementsWorkerCapability = (typeof RQW_CAPABILITIES)[number];

export type StakeholderEntry = string | { name: string; role: string };

export type FunctionalRequirement = {
  id: string;
  statement: string;
  priority?: "high" | "medium" | "low";
  category?: string;
};

export type NonFunctionalRequirement = {
  id: string;
  statement: string;
  category?: string;
};

export type UserStory = {
  id: string;
  asA: string;
  iWant: string;
  soThat: string;
  priority?: "high" | "medium" | "low";
};

export type UseCase = {
  id: string;
  title: string;
  actors: string[];
  preconditions: string[];
  mainFlow: string[];
  postconditions: string[];
};

export type AcceptanceCriterion = {
  id: string;
  storyId?: string;
  criterion: string;
  measurable?: boolean;
};

export type RiskEntry = {
  id?: string;
  description: string;
  severity?: "high" | "medium" | "low";
};

export type BusinessRule = {
  id: string;
  statement: string;
  category?: string;
};

export type RequirementsStep = {
  stepId: string;
  stepType: string;
  title: string;
  order: number;
  summary?: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type SelfReviewFinding = {
  findingId: string;
  category: string;
  severity: "info" | "warning" | "error";
  message: string;
};

export type SelfReviewResult = {
  passed: boolean;
  summary: string;
  qualityReview: string;
  complianceReview: string;
  findings: SelfReviewFinding[];
  confidenceScore: number;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  intentAvailable: boolean;
};

/** Machine-readable Requirements Report (Q6-02). */
export type RequirementsReport = {
  requirementsId: string;
  timestamp: string;
  platformId: string;
  platformName: string;
  businessObjective: string;
  stakeholders: StakeholderEntry[];
  functionalRequirements: FunctionalRequirement[];
  nonFunctionalRequirements: NonFunctionalRequirement[];
  userStories: UserStory[];
  useCases: UseCase[];
  acceptanceCriteria: AcceptanceCriterion[];
  assumptions: string[];
  constraints: string[];
  technicalConstraints: string[];
  regulatoryConstraints: string[];
  risks: RiskEntry[];
  businessRules: BusinessRule[];
  confidenceScore: number;
  metadataVersion: string;
  businessId: string;
  factoryMissionId: string;
  approvedBusinessIntent: string;
  intentApproved: boolean;
  requirementType: RequirementType;
  supportedRequirementTypes: RequirementType[];
  requirementsSteps: RequirementsStep[];
  selfReviewPassed: boolean;
  selfReviewFindings: SelfReviewFinding[];
  selfReviewSummary: string;
  qualityReview: string;
  complianceReview: string;
  researchCompliance: ResearchComplianceLevel;
  researchComplianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverDesignArchitecture: true;
  neverWriteApplicationCode: true;
  neverDeploySoftware: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedBusinessRequirements: true;
  neverImplementQ603OrLater: true;
  followApprovedBusinessIntent: true;
  preserveCompleteTraceability: true;
  distinguishRequirementsFromAssumptions: true;
  validateCompletenessBeforeSubmission: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type RequirementsContext = {
  platformId?: string | null;
  platformName?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  businessObjective?: string | null;
  approvedBusinessIntent?: string | null;
  intentApproved?: boolean;
  stakeholders?: StakeholderEntry[];
  requirementType?: RequirementType | null;
};

export type RequirementsWorkerInput = {
  requirementsId?: string | null;
  platformId?: string | null;
  platformName?: string | null;
  businessId?: string | null;
  factoryMissionId?: string | null;
  businessObjective?: string | null;
  approvedBusinessIntent?: string | null;
  intentApproved?: boolean;
  stakeholders?: StakeholderEntry[] | null;
  requirementType?: RequirementType | string | null;
  confidenceScore?: number | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  designArchitecture?: boolean;
  writeApplicationCode?: boolean;
  deploySoftware?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  inventUnsupportedBusinessRequirements?: boolean;
  implementQ603OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type RequirementsWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RequirementsWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-RQW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: RequirementsWorkerCapability[];
  totalRequirementsReports: number;
  lastRequirementsReportId: string | null;
  lastRequirementType: RequirementType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type RequirementsWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  requirementsReports: RequirementsReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverDesignArchitecture: true;
  neverWriteApplicationCode: true;
  neverDeploySoftware: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedBusinessRequirements: true;
  neverImplementQ603OrLater: true;
};

export type RequirementsWorkerRunReport = {
  requirementsRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_business_intent"
    | "identify_stakeholders"
    | "define_business_objectives"
    | "produce_functional_requirements"
    | "produce_non_functional_requirements"
    | "generate_user_stories"
    | "generate_use_cases"
    | "generate_acceptance_criteria"
    | "identify_assumptions_risks_and_constraints"
    | "produce_requirements_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: RequirementsWorkerEngineRecord;
  catalog: RequirementsWorkerCatalog | null;
  requirementsReports: RequirementsReport[];
  latestRequirementsReport: RequirementsReport | null;
  integrations: IntegrationHandshake[];
  validation: RequirementsWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RequirementsWorkerState = {
  engineVersion: "PILLOW-RQW-001";
  missionId: "Q6-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: RequirementsWorkerConfiguration;
  latestReport: RequirementsWorkerRunReport | null;
  engineRecord: RequirementsWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalRequirementsReports: number;
    lastRequirementsReportId: string | null;
    lastRequirementType: RequirementType | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type RequirementsWorkerCockpitSnapshot = {
  missionId: "Q6-02";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalRequirementsReports: number;
  latestRequirementsReportId: string | null;
  lastRequirementType: RequirementType | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverDesignArchitecture: true;
  neverWriteApplicationCode: true;
  neverDeploySoftware: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverInventUnsupportedBusinessRequirements: true;
  neverImplementQ603OrLater: true;
};

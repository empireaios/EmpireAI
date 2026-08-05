import type { AiInnovationFactoryConfiguration } from "./configuration.js";

import type {

  APPROVAL_STATUSES,

  AIFRT_CAPABILITIES,

  ENGINE_HEALTH_STATUSES,

  ENGINE_STATUSES,

  INTEGRATION_TARGETS,

  INNOVATION_CATEGORIES,

  OPERATIONAL_STATES,

  PRIORITY_LEVELS,

  VALIDATION_STATUSES,

} from "./paths.js";



export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];

export type InnovationCategory = (typeof INNOVATION_CATEGORIES)[number];

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type PriorityLevel = (typeof PRIORITY_LEVELS)[number];

export type AifrtCapability = (typeof AIFRT_CAPABILITIES)[number];

export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];



/** LOCKED InnovationProposal model fields. */

export type InnovationProposal = {

  innovationId: string;

  category: InnovationCategory;

  opportunity: string;

  description: string;

  expectedBenefit: string;

  estimatedCost: string;

  estimatedRisk: string;

  priority: PriorityLevel;

  recommendation: string;

  approvalStatus: ApprovalStatus;

  supportingEvidence: string[];

  auditReference: string;

  timestamp: string;

};



export type Q1201ContractConsumption = {

  attempted: boolean;

  consumed: boolean;

  contractVersion: string | null;

  fields: string[];

  finalCompletionDecision: string | null;

  seriesCompletePrerequisite: boolean;

  evidence: string;

};



export type GkQ1201Observation = {

  observed: boolean;

  contractVersion: string | null;

  grandKingDecision: string | null;

  deploymentAuthorisationStatus: string | null;

  evidence: string;

};



export type SeriesCompletePrerequisite = {

  verified: boolean;

  seriesCompleteActivation: boolean;

  q1201Consumed: boolean;

  finalCompletionDecision: string | null;

  outstandingPrerequisiteIssues: string[];

  evidence: string[];

};



export type TechnologyResearchSummary = {

  computedAt: string;

  catalogEntries: number;

  injectedEvidenceCount: number;

  runtimeGapSignals: number;

  entries: Array<{ catalogId: string; category: InnovationCategory; name: string; evidenceRef: string }>;

  evidence: string[];

};



export type ModelApiTrackingSummary = {

  computedAt: string;

  trackedModels: Array<{ catalogId: string; name: string; category: InnovationCategory; evidenceRef: string }>;

  trackedApis: Array<{ catalogId: string; name: string; evidenceRef: string }>;

  evidence: string[];

};



export type BusinessOpportunitySummary = {

  computedAt: string;

  opportunities: Array<{ opportunity: string; factoryKey?: string; evidence: string }>;

  evidence: string[];

};



export type ArchitectureRecommendationSummary = {

  computedAt: string;

  recommendations: Array<{ gap: string; recommendation: string; evidence: string }>;

  evidence: string[];

};



export type OperationalImprovementSummary = {

  computedAt: string;

  improvements: Array<{ signal: string; recommendation: string; evidence: string }>;

  evidence: string[];

};



export type CostOptimisationSummary = {

  computedAt: string;

  proposals: Array<{ area: string; expectedSaving: string; evidence: string }>;

  evidence: string[];

};



export type RiskSummary = {

  computedAt: string;

  risks: Array<{ risk: string; level: string; mitigation: string }>;

  evidence: string[];

};



export type PriorityRanking = {

  computedAt: string;

  ranking: Array<{ innovationId: string; priority: PriorityLevel; score: number }>;

  evidence: string[];

};



export type AifrtValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



/** LOCKED AiInnovationReport minimum + CRT extras. */

export type AiInnovationReport = {

  reportId: string;

  timestamp: string;

  innovationVersion: typeof import("./paths.js").AI_INNOVATION_FACTORY_RUNTIME_VERSION;

  engineId: "PILLOW-AIFRT-001";

  missionId: "Q12-01";

  technologySummary: TechnologyResearchSummary;

  businessOpportunitySummary: BusinessOpportunitySummary;

  architectureRecommendations: ArchitectureRecommendationSummary;

  operationalImprovements: OperationalImprovementSummary;

  costOptimisationSummary: CostOptimisationSummary;

  riskSummary: RiskSummary;

  priorityRanking: PriorityRanking;

  supportingEvidence: string[];

  outstandingIssues: string[];

  confidenceScore: number;

  metadataVersion: string;

  reportVersion: string;

  workerId: string;

  proposals: InnovationProposal[];

  q1201ContractConsumed: Q1201ContractConsumption;

  gkQ1201Observation: GkQ1201Observation;

  seriesCompleteActivation: boolean;

  consumableByQ1301: boolean;

  neverImplementQ1301OrLater: true;

  neverAutoDeployInnovations: true;

  evidenceBasedOnly: true;

  submittedToExecutiveReporting: boolean;

  executiveReportId: string | null;

  validation: AifrtValidationReport;

  traceabilityRefs: string[];

  runTimestamp: string;

  preserveCompleteTraceability: true;

  preserveInnovationHistory: true;

  preserveAuditHistory: true;

  deterministicInnovationBehaviour: true;

  maskSensitiveValues: true;

  neverFabricateResearchEvidence: true;

  neverBypassGovernance: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverClaimQSeriesCompleteWhenIncomplete: true;

};



export type AifrtInput = {

  reportId?: string | null;

  missionId?: string | null;

  pillowCommandConfirmed?: boolean;

  validated?: boolean;

  fabricateResearchEvidence?: boolean;

  autoDeployInnovations?: boolean;

  bypassGovernance?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ1301OrLater?: boolean;

  claimQSeriesComplete?: boolean;

  grandKingApproved?: boolean;

  forceApprove?: boolean;

};



export type AifrtRunReport = AiInnovationReport;



export type IntegrationHandshake = {

  target: IntegrationTarget;

  status: "ready" | "bound" | "unavailable";

  details: string;

  timestamp: string;

};



export type AifrtEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: "PILLOW-AIFRT-001";

  currentOperationalState: OperationalState;

  healthStatus: EngineHealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: AifrtCapability[];

  totalReports: number;

  lastReportId: string | null;

  lastConfidenceScore: number | null;

  lastSeriesCompleteActivation: boolean | null;

  workerId: string;

  integrationTargets: IntegrationTarget[];

  metadataVersion: string;

};



export type AifrtCatalog = {

  reportVersion: string;

  workerId: string;

  reports: AiInnovationReport[];

  integrations: IntegrationHandshake[];

  metadataVersion: string;

  neverFabricateResearchEvidence: true;

  neverImplementQ1301OrLater: true;

};



/** Q12-01 exposed contract — innovation prerequisite for Q13-01 without implementing Q13-01. */

export type Q1301ConsumableContract = {

  contractId: string;

  contractVersion: string;

  producedBy: "ai-innovation-factory";

  missionId: "Q12-01";

  consumerMissionId: "Q13-01";

  exposedFields: string[];

  innovationCatalog: string[];

  notes: string[];

  neverImplementQ1301OrLater: true;

  structuralSignalOnly: true;

  innovationPrerequisite: true;

};



export type AiInnovationFactoryState = {

  engineVersion: "PILLOW-AIFRT-001";

  missionId: "Q12-01";

  status: EngineStatus;

  initializedAt: string;

  configuration: AiInnovationFactoryConfiguration;

  latestReport: AiInnovationReport | null;

  engineRecord: AifrtEngineRecord | null;

  health: {

    status: EngineHealthStatus;

    healthScore: number;

    engineEnabled: boolean;

    lastOperationAt: string | null;

    lastValidationDecision: "pass" | "partial" | "fail" | null;

    totalReports: number;

    lastReportId: string | null;

    lastConfidenceScore: number | null;

    lastSeriesCompleteActivation: boolean | null;

    notes: string[];

  };

};



export type AiInnovationFactoryCockpitSnapshot = {

  missionId: "Q12-01";

  status: EngineStatus;

  healthStatus: EngineHealthStatus;

  totalReports: number;

  latestReportId: string | null;

  lastSeriesCompleteActivation: boolean | null;

  workerId: string;

  neverFabricateResearchEvidence: true;

  neverAutoDeployInnovations: true;

  neverBypassGovernance: true;

  neverImplementQ1301OrLater: true;

};



export type InnovationHistoryEntry = {

  entryId: string;

  timestamp: string;

  reportId: string | null;

  proposalCount: number;

  seriesCompleteActivation: boolean;

  confidenceScore: number;

  evidence: string[];

};



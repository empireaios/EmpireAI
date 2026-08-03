import type { ArchitectureWorkerConfiguration } from "./configuration.js";

import type {

  ARCHITECTURAL_COMPLIANCE_LEVELS,

  ARCHITECTURE_DOMAINS,

  ARW_CAPABILITIES,

  ENGINE_HEALTH_STATUSES,

  ENGINE_STATUSES,

  INTEGRATION_TARGETS,

  OPERATIONAL_STATES,

  VALIDATION_STATUSES,

} from "./paths.js";



export type EngineStatus = (typeof ENGINE_STATUSES)[number];

export type OperationalState = (typeof OPERATIONAL_STATES)[number];

export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];

export type ArchitectureDomain = (typeof ARCHITECTURE_DOMAINS)[number];

export type ArchitecturalComplianceLevel = (typeof ARCHITECTURAL_COMPLIANCE_LEVELS)[number];

export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];

export type ArchitectureWorkerCapability = (typeof ARW_CAPABILITIES)[number];



export type ModuleArchitectureEntry = {

  moduleId: string;

  name: string;

  responsibility: string;

  dependencies?: string[];

};



export type ApiArchitectureEntry = {

  apiId: string;

  name: string;

  protocol?: string;

  endpoints?: string[];

  direction?: "internal" | "external" | "both";

};



export type DataFlowEntry = {

  flowId: string;

  from: string;

  to: string;

  description: string;

  dataType?: string;

};



export type ServiceDependencyEntry = {

  dependencyId: string;

  fromService: string;

  toService: string;

  kind?: string;

};



export type DeploymentArchitecture = {

  topology: string;

  environments: string[];

  components: Array<{ componentId: string; name: string; role: string }>;

};



export type IntegrationArchitectureEntry = {

  integrationId: string;

  system: string;

  pattern: string;

  notes?: string;

};



export type ArchitecturalDecision = {

  decisionId: string;

  topic: string;

  decision: string;

  recordedAt: string;

};



export type ArchitectureStep = {

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

  architecturalCompliance: ArchitecturalComplianceLevel;

  architecturalComplianceNotes: string;

  requirementsAvailable: boolean;

};



/** Machine-readable Architecture Report (Q6-03). */

export type ArchitectureReport = {

  architectureId: string;

  timestamp: string;

  platformId: string;

  platformName: string;

  systemOverview: string;

  moduleArchitecture: ModuleArchitectureEntry[];

  apiArchitecture: ApiArchitectureEntry[];

  dataFlow: DataFlowEntry[];

  serviceDependencies: ServiceDependencyEntry[];

  deploymentArchitecture: DeploymentArchitecture;

  integrationArchitecture: IntegrationArchitectureEntry[];

  securityConsiderations: string[];

  scalabilityConsiderations: string[];

  maintainabilityConsiderations: string[];

  confidenceScore: number;

  metadataVersion: string;

  requirementsReportId: string;

  factoryMissionId: string;

  businessId: string;

  businessObjective: string;

  architecturalDecisions: ArchitecturalDecision[];

  assumptions: string[];

  supportedArchitectureDomains: ArchitectureDomain[];

  architectureSteps: ArchitectureStep[];

  selfReviewPassed: boolean;

  selfReviewFindings: SelfReviewFinding[];

  selfReviewSummary: string;

  qualityReview: string;

  complianceReview: string;

  architecturalCompliance: ArchitecturalComplianceLevel;

  architecturalComplianceNotes: string;

  workerId: string;

  reportVersion: string;

  traceabilityRefs: string[];

  preservedDecisions: PreservedDecision[];

  submittedToExecutiveReporting: boolean;

  executiveReportId: string | null;

  neverWriteFrontendCode: true;

  neverWriteBackendCode: true;

  neverDeployApplications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementApplicationLogic: true;

  neverImplementQ604OrLater: true;

  followApprovedRequirements: true;

  preserveCompleteTraceability: true;

  separateArchitecturalDecisionsFromAssumptions: true;

  validateArchitecturalConsistency: true;

  preserveAuditHistory: true;

  structuralSignalOnly: true;

  maskSensitiveValues: true;

};



export type ArchitectureContext = {

  platformId?: string | null;

  platformName?: string | null;

  businessId?: string | null;

  factoryMissionId?: string | null;

  businessObjective?: string | null;

  requirementsReportId?: string | null;

  functionalRequirements?: Array<{ id?: string; statement?: string }>;

  userStories?: Array<{ id?: string; asA?: string; iWant?: string; soThat?: string }>;

};



export type ArchitectureWorkerInput = {

  architectureId?: string | null;

  requirementsReportId?: string | null;

  platformId?: string | null;

  platformName?: string | null;

  businessId?: string | null;

  factoryMissionId?: string | null;

  businessObjective?: string | null;

  confidenceScore?: number | null;

  validated?: boolean;

  /** Forbidden boundary attempts — always rejected. */

  writeFrontendCode?: boolean;

  writeBackendCode?: boolean;

  deployApplications?: boolean;

  implementApplicationLogic?: boolean;

  overridePillow?: boolean;

  overrideGrandKing?: boolean;

  implementQ604OrLater?: boolean;

};



export type IntegrationHandshake = {

  target: IntegrationTarget;

  status: "ready" | "bound" | "unavailable";

  details: string;

  timestamp: string;

};



export type ArchitectureWorkerValidationReport = {

  validationReportId: string;

  validationTimestamp: string;

  decision: "pass" | "partial" | "fail";

  errors: string[];

  warnings: string[];

  durationMs: number;

  metadataVersion: string;

};



export type ArchitectureWorkerEngineRecord = {

  engineRecordId: string;

  timestamp: string;

  engineId: string;

  engineVersion: "PILLOW-ARW-001";

  currentOperationalState: OperationalState;

  healthStatus: EngineHealthStatus;

  validationStatus: ValidationStatus;

  supportedCapabilities: ArchitectureWorkerCapability[];

  totalArchitectureReports: number;

  lastArchitectureReportId: string | null;

  lastArchitectureDomain: ArchitectureDomain | null;

  lastConfidenceScore: number | null;

  workerId: string;

  integrationTargets: IntegrationTarget[];

  metadataVersion: string;

};



export type ArchitectureWorkerCatalog = {

  reportVersion: string;

  workerId: string;

  architectureReports: ArchitectureReport[];

  integrations: IntegrationHandshake[];

  metadataVersion: string;

  executiveAuthority: "pillow";

  neverWriteFrontendCode: true;

  neverWriteBackendCode: true;

  neverDeployApplications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementApplicationLogic: true;

  neverImplementQ604OrLater: true;

};



export type ArchitectureWorkerRunReport = {

  architectureRunReportId: string;

  runTimestamp: string;

  action:

    | "connect"

    | "receive_approved_requirements_reports"

    | "design_overall_system_architecture"

    | "define_application_modules"

    | "design_internal_and_external_apis"

    | "design_service_boundaries"

    | "design_data_flow_architecture"

    | "design_deployment_topology"

    | "identify_architectural_dependencies"

    | "evaluate_scalability_security_and_maintainability"

    | "produce_architecture_report"

    | "submit_report"

    | "list"

    | "validate"

    | "diagnostics";

  engineRecord: ArchitectureWorkerEngineRecord;

  catalog: ArchitectureWorkerCatalog | null;

  architectureReports: ArchitectureReport[];

  latestArchitectureReport: ArchitectureReport | null;

  integrations: IntegrationHandshake[];

  validation: ArchitectureWorkerValidationReport;

  durationMs: number;

  metadataVersion: string;

};



export type ArchitectureWorkerState = {

  engineVersion: "PILLOW-ARW-001";

  missionId: "Q6-03";

  status: EngineStatus;

  initializedAt: string;

  configuration: ArchitectureWorkerConfiguration;

  latestReport: ArchitectureWorkerRunReport | null;

  engineRecord: ArchitectureWorkerEngineRecord | null;

  health: {

    status: EngineHealthStatus;

    healthScore: number;

    engineEnabled: boolean;

    lastOperationAt: string | null;

    lastValidationDecision: "pass" | "partial" | "fail" | null;

    totalArchitectureReports: number;

    lastArchitectureReportId: string | null;

    lastArchitectureDomain: ArchitectureDomain | null;

    lastConfidenceScore: number | null;

    notes: string[];

  };

};



export type ArchitectureWorkerCockpitSnapshot = {

  missionId: "Q6-03";

  status: EngineStatus;

  healthStatus: EngineHealthStatus;

  totalArchitectureReports: number;

  latestArchitectureReportId: string | null;

  lastArchitectureDomain: ArchitectureDomain | null;

  lastConfidenceScore: number | null;

  workerId: string;

  neverWriteFrontendCode: true;

  neverWriteBackendCode: true;

  neverDeployApplications: true;

  neverOverridePillow: true;

  neverOverrideGrandKing: true;

  neverImplementApplicationLogic: true;

  neverImplementQ604OrLater: true;

};



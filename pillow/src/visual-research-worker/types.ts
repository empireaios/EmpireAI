import type { VisualResearchWorkerConfiguration } from "./configuration.js";
import type {
  ASSET_TYPES,
  CONTENT_FORMATS,
  COPYRIGHT_STATUSES,
  COVERAGE_STATUSES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  OPERATIONAL_STATES,
  VRW_CAPABILITIES,
  INTEGRATION_TARGETS,
  USAGE_RIGHTS,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type ContentFormat = (typeof CONTENT_FORMATS)[number];
export type AssetType = (typeof ASSET_TYPES)[number];
export type CopyrightStatus = (typeof COPYRIGHT_STATUSES)[number];
export type UsageRights = (typeof USAGE_RIGHTS)[number];
export type CoverageStatus = (typeof COVERAGE_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type VisualResearchWorkerCapability = (typeof VRW_CAPABILITIES)[number];

export type ScriptSection = {
  sectionId?: string;
  title?: string;
  content?: string;
  durationSeconds?: number;
};

export type CandidateAsset = {
  assetId?: string;
  source?: string;
  assetType?: AssetType | string;
  title?: string;
  url?: string;
};

export type VisualSceneRecord = {
  sceneNumber: number;
  requiredVisual: string;
  visualSource: string;
  assetType: AssetType;
  copyrightStatus: CopyrightStatus;
  usageRights: UsageRights;
  timelinePosition: string;
  coverageStatus: CoverageStatus;
  assetId?: string;
  licensingNotes?: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type LicensingRestriction = {
  restrictionId: string;
  assetRef: string;
  restriction: string;
  severity: "info" | "warning" | "error";
};

/** Machine-readable Visual Research Report (Q4-08). */
export type VisualResearchReport = {
  visualResearchId: string;
  timestamp: string;
  scriptId: string;
  sceneNumber: number;
  requiredVisual: string;
  visualSource: string;
  assetType: AssetType;
  copyrightStatus: CopyrightStatus;
  usageRights: UsageRights;
  timelinePosition: string;
  coverageStatus: CoverageStatus;
  confidenceScore: number;
  metadataVersion: string;
  channelId: string;
  thumbnailReportId: string | null;
  topicId: string;
  contentFormat: ContentFormat;
  scenes: VisualSceneRecord[];
  missingAssets: string[];
  licensingRestrictions: LicensingRestriction[];
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverGenerateFinalCreativeAssets: true;
  neverEditImages: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ409OrLater: true;
  useOnlyApprovedVisualSources: true;
  preserveCompleteAssetTraceability: true;
  preserveCopyrightInformation: true;
  identifyLicensingRestrictions: true;
  detectMissingVisualAssets: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type VisualResearchWorkerInput = {
  visualResearchId?: string | null;
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  contentFormat?: ContentFormat | string | null;
  scriptTitle?: string | null;
  scriptIntent?: string | null;
  scriptSections?: ScriptSection[] | null;
  thumbnailReportId?: string | null;
  candidateAssets?: CandidateAsset[] | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  generateFinalCreativeAssets?: boolean;
  editImages?: boolean;
  assembleVideos?: boolean;
  publishContent?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ409OrLater?: boolean;
  useUnapprovedVisualSource?: boolean;
  unapprovedSource?: string | null;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type VisualResearchWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type VisualResearchWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-VRW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: VisualResearchWorkerCapability[];
  totalVisualResearchReports: number;
  lastVisualResearchId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type VisualResearchWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  visualResearchReports: VisualResearchReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverGenerateFinalCreativeAssets: true;
  neverEditImages: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type VisualResearchWorkerRunReport = {
  visualResearchRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_approved_script"
    | "break_into_visual_scenes"
    | "identify_required_visual_assets"
    | "search_approved_stock_libraries"
    | "search_public_domain_sources"
    | "identify_internally_generated_assets"
    | "classify_copyright_status"
    | "match_visuals_to_script_timeline"
    | "detect_missing_visual_coverage"
    | "produce_visual_research_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: VisualResearchWorkerEngineRecord;
  catalog: VisualResearchWorkerCatalog | null;
  visualResearchReports: VisualResearchReport[];
  latestVisualResearchReport: VisualResearchReport | null;
  integrations: IntegrationHandshake[];
  validation: VisualResearchWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type VisualResearchWorkerState = {
  engineVersion: "PILLOW-VRW-001";
  missionId: "Q4-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: VisualResearchWorkerConfiguration;
  latestReport: VisualResearchWorkerRunReport | null;
  engineRecord: VisualResearchWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalVisualResearchReports: number;
    lastVisualResearchId: string | null;
    lastScriptId: string | null;
    lastContentFormat: ContentFormat | null;
    lastConfidenceScore: number | null;
    notes: string[];
  };
};

export type VisualResearchWorkerCockpitSnapshot = {
  missionId: "Q4-08";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalVisualResearchReports: number;
  latestVisualResearchId: string | null;
  lastScriptId: string | null;
  lastContentFormat: ContentFormat | null;
  lastConfidenceScore: number | null;
  workerId: string;
  neverGenerateFinalCreativeAssets: true;
  neverEditImages: true;
  neverAssembleVideos: true;
  neverPublishContent: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type VisualResearchContext = {
  scriptId?: string | null;
  channelId?: string | null;
  topicId?: string | null;
  scriptTitle?: string | null;
  scriptIntent?: string | null;
  scriptSections?: ScriptSection[];
  thumbnailReportId?: string | null;
  contentFormat?: ContentFormat | null;
  candidateAssets?: CandidateAsset[];
  receivedScript?: boolean;
  scenes?: VisualSceneRecord[];
};

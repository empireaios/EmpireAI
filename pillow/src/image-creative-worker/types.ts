import type { ImageCreativeWorkerConfiguration } from "./configuration.js";
import type {
  COPYRIGHT_STATUSES,
  CREATIVE_ASSET_TYPES,
  ENGINE_HEALTH_STATUSES,
  ENGINE_STATUSES,
  ICW_CAPABILITIES,
  INTEGRATION_TARGETS,
  OPERATIONAL_STATES,
  QUALITY_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";

export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type EngineHealthStatus = (typeof ENGINE_HEALTH_STATUSES)[number];
export type CreativeAssetType = (typeof CREATIVE_ASSET_TYPES)[number];
export type QualityStatus = (typeof QUALITY_STATUSES)[number];
export type CopyrightStatus = (typeof COPYRIGHT_STATUSES)[number];
export type IntegrationTarget = (typeof INTEGRATION_TARGETS)[number];
export type ImageCreativeWorkerCapability = (typeof ICW_CAPABILITIES)[number];

export type SourceAssetRef = {
  assetId: string;
  assetPath: string;
  assetType: string;
  copyrightStatus?: CopyrightStatus | string;
  source?: string;
};

export type GeneratedAssetRef = {
  assetId: string;
  assetPath: string;
  assetType: CreativeAssetType;
  variantLabel?: string;
  descriptor: string;
};

export type EditOperation = {
  operationId: string;
  operationType: string;
  description: string;
  appliedTo: string;
};

export type CreativeVariant = {
  variantId: string;
  variantLabel: string;
  assetId: string;
  assetPath: string;
  assetType: CreativeAssetType;
  descriptor: string;
};

export type PreservedDecision = {
  decisionId: string;
  topic: string;
  decision: string;
  recordedAt: string;
};

export type ThumbnailSpecRef = {
  specId: string;
  conceptId?: string;
  textOverlay?: string;
  composition?: string;
  emotionalTrigger?: string;
};

export type VisualResearchSceneRef = {
  sceneId: string;
  sceneLabel: string;
  requiredAssets: string[];
  copyrightStatus?: CopyrightStatus | string;
};

/** Machine-readable Creative Asset Report (Q4-09). */
export type CreativeAssetReport = {
  creativeAssetId: string;
  timestamp: string;
  scriptId: string;
  sceneId: string;
  assetType: CreativeAssetType;
  sourceAssets: (string | SourceAssetRef)[];
  generatedAssets: (string | GeneratedAssetRef)[];
  editOperations: EditOperation[];
  qualityStatus: QualityStatus;
  copyrightStatus: CopyrightStatus;
  variantCount: number;
  metadataVersion: string;
  channelId: string;
  visualResearchId: string | null;
  thumbnailReportId: string | null;
  variants: CreativeVariant[];
  complianceNotes: string;
  workerId: string;
  reportVersion: string;
  traceabilityRefs: string[];
  preservedDecisions: PreservedDecision[];
  submittedToExecutiveReporting: boolean;
  executiveReportId: string | null;
  neverAssembleVideos: true;
  neverGenerateVoiceovers: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverImplementQ410OrLater: true;
  preserveCompleteAssetTraceability: true;
  respectCopyrightAndLicensing: true;
  preserveOriginalAssets: true;
  recordAllEditsPerformed: true;
  produceMultipleVariantsWhenAppropriate: true;
  preserveAuditHistory: true;
  structuralSignalOnly: true;
  maskSensitiveValues: true;
};

export type ImageCreativeWorkerInput = {
  creativeAssetId?: string | null;
  scriptId?: string | null;
  sceneId?: string | null;
  channelId?: string | null;
  visualResearchId?: string | null;
  thumbnailReportId?: string | null;
  assetType?: CreativeAssetType | string | null;
  sourceAssets?: (string | SourceAssetRef)[] | null;
  thumbnailSpecs?: ThumbnailSpecRef[] | null;
  visualResearchScenes?: VisualResearchSceneRef[] | null;
  editorialNotes?: string | null;
  validated?: boolean;
  /** Forbidden boundary attempts — always rejected. */
  assembleVideos?: boolean;
  generateVoiceovers?: boolean;
  publishMedia?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
  implementQ410OrLater?: boolean;
};

export type IntegrationHandshake = {
  target: IntegrationTarget;
  status: "ready" | "bound" | "unavailable";
  details: string;
  timestamp: string;
};

export type ImageCreativeWorkerValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ImageCreativeWorkerEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: "PILLOW-ICW-001";
  currentOperationalState: OperationalState;
  healthStatus: EngineHealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: ImageCreativeWorkerCapability[];
  totalCreativeAssetReports: number;
  lastCreativeAssetId: string | null;
  lastScriptId: string | null;
  lastAssetType: CreativeAssetType | null;
  lastVariantCount: number | null;
  workerId: string;
  integrationTargets: IntegrationTarget[];
  metadataVersion: string;
};

export type ImageCreativeWorkerCatalog = {
  reportVersion: string;
  workerId: string;
  creativeAssetReports: CreativeAssetReport[];
  integrations: IntegrationHandshake[];
  metadataVersion: string;
  executiveAuthority: "pillow";
  neverAssembleVideos: true;
  neverGenerateVoiceovers: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type ImageCreativeWorkerRunReport = {
  creativeRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "receive_visual_research_report"
    | "receive_thumbnail_specifications"
    | "generate_original_graphics"
    | "edit_existing_images"
    | "create_diagrams_and_infographics"
    | "create_covers_and_banners"
    | "create_social_media_assets"
    | "generate_multiple_creative_variants"
    | "validate_asset_quality_and_compliance"
    | "produce_creative_asset_report"
    | "submit_report"
    | "list"
    | "validate"
    | "diagnostics";
  engineRecord: ImageCreativeWorkerEngineRecord;
  catalog: ImageCreativeWorkerCatalog | null;
  creativeAssetReports: CreativeAssetReport[];
  latestCreativeAssetReport: CreativeAssetReport | null;
  integrations: IntegrationHandshake[];
  validation: ImageCreativeWorkerValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ImageCreativeWorkerState = {
  engineVersion: "PILLOW-ICW-001";
  missionId: "Q4-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: ImageCreativeWorkerConfiguration;
  latestReport: ImageCreativeWorkerRunReport | null;
  engineRecord: ImageCreativeWorkerEngineRecord | null;
  health: {
    status: EngineHealthStatus;
    healthScore: number;
    engineEnabled: boolean;
    lastOperationAt: string | null;
    lastValidationDecision: "pass" | "partial" | "fail" | null;
    totalCreativeAssetReports: number;
    lastCreativeAssetId: string | null;
    lastScriptId: string | null;
    lastAssetType: CreativeAssetType | null;
    lastVariantCount: number | null;
    notes: string[];
  };
};

export type ImageCreativeWorkerCockpitSnapshot = {
  missionId: "Q4-09";
  status: EngineStatus;
  healthStatus: EngineHealthStatus;
  totalCreativeAssetReports: number;
  latestCreativeAssetId: string | null;
  lastScriptId: string | null;
  lastAssetType: CreativeAssetType | null;
  lastVariantCount: number | null;
  workerId: string;
  neverAssembleVideos: true;
  neverGenerateVoiceovers: true;
  neverPublishMedia: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
};

export type CreativeContext = {
  scriptId?: string | null;
  sceneId?: string | null;
  channelId?: string | null;
  visualResearchId?: string | null;
  thumbnailReportId?: string | null;
  assetType?: CreativeAssetType | null;
  sourceAssets?: (string | SourceAssetRef)[];
  thumbnailSpecs?: ThumbnailSpecRef[];
  visualResearchScenes?: VisualResearchSceneRef[];
  editorialNotes?: string | null;
  receivedVisualResearch?: boolean;
  receivedThumbnailSpecs?: boolean;
  editOperations?: EditOperation[];
};

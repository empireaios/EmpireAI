/** PILLOW-DSI-001 — Design System Intelligence types (T2-02). */

import type {
  COMPONENT_FAMILIES,
  COMPONENT_STATUSES,
  INTELLIGENCE_STATUSES,
  SIZE_VARIANTS,
  SUPPORTED_PATTERNS,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { DesignSystemIntelligenceConfiguration } from "./configuration.js";

export type DesignSystemIntelligenceEngineVersion = "PILLOW-DSI-001";
export type IntelligenceStatus = (typeof INTELLIGENCE_STATUSES)[number];
export type ComponentStatus = (typeof COMPONENT_STATUSES)[number];
export type SizeVariant = (typeof SIZE_VARIANTS)[number];
export type ComponentFamily = (typeof COMPONENT_FAMILIES)[number];
export type SupportedPattern = (typeof SUPPORTED_PATTERNS)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type TypographyStandard = {
  tokenId: string;
  name: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: number;
  lineHeight: number;
  usage: string;
};

export type ColorToken = {
  tokenId: string;
  name: string;
  value: string;
  role: "background" | "foreground" | "accent" | "border" | "semantic";
  usage: string;
};

export type SpacingToken = {
  tokenId: string;
  name: string;
  valuePx: number;
  usage: string;
};

export type SizingToken = {
  tokenId: string;
  name: string;
  minWidthPx: number;
  maxWidthPx: number;
  minHeightPx: number;
  maxHeightPx: number;
  variant: SizeVariant;
};

export type IconStandard = {
  iconId: string;
  name: string;
  category: string;
  sizePx: number;
  usage: string;
};

export type LayoutStandard = {
  standardId: string;
  name: string;
  regionType: string;
  minRegions: number;
  alignmentRules: string[];
  responsiveBreakpoints: string[];
};

export type InteractionStandard = {
  standardId: string;
  name: string;
  componentFamily: ComponentFamily;
  supportedStates: string[];
  interactionModes: string[];
};

export type DesignSystemComponent = {
  componentId: string;
  componentName: string;
  componentFamily: ComponentFamily;
  componentVariant: string;
  componentCategory: string;
  supportedStates: string[];
  sizeVariants: SizeVariant[];
  colorVariants: string[];
  typographyRules: string[];
  spacingRules: string[];
  layoutRules: string[];
  interactionRules: string[];
  usageCount: number;
  status: ComponentStatus;
  version: string;
  metadataVersion: string;
};

export type ComponentFamilyEntry = {
  familyId: string;
  familyName: ComponentFamily;
  componentIds: string[];
  variantCount: number;
  description: string;
};

export type ComponentVariantEntry = {
  variantId: string;
  baseComponentType: string;
  variantName: string;
  sizeVariant: SizeVariant;
  componentIds: string[];
  usageCount: number;
};

export type DesignSystemModel = {
  designSystemId: string;
  version: string;
  componentLibrary: DesignSystemComponent[];
  componentFamilies: ComponentFamilyEntry[];
  componentVariants: ComponentVariantEntry[];
  typographyStandards: TypographyStandard[];
  colorPalette: ColorToken[];
  spacingScale: SpacingToken[];
  sizingScale: SizingToken[];
  iconLibrary: IconStandard[];
  layoutStandards: LayoutStandard[];
  interactionStandards: InteractionStandard[];
  supportedPatterns: SupportedPattern[];
  deprecatedPatterns: string[];
  timestamp: string;
  metadataVersion: string;
};

export type DesignSystemDeviation = {
  deviationId: string;
  category: string;
  severity: "info" | "warning" | "error";
  componentId: string | null;
  description: string;
  expected: string;
  observed: string;
  evidenceMetadata: Record<string, unknown>;
  timestamp: string;
  metadataVersion: string;
};

export type DesignSystemValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  deviations: DesignSystemDeviation[];
  componentsValidated: number;
  familiesValidated: number;
  standardsChecked: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DesignSystemAnalysisReport = {
  analysisReportId: string;
  analysisTimestamp: string;
  model: DesignSystemModel;
  validation: DesignSystemValidationReport;
  evolutionSummary: {
    previousVersion: string | null;
    currentVersion: string;
    newComponents: number;
    updatedComponents: number;
    deprecatedComponents: number;
  };
  durationMs: number;
  metadataVersion: string;
};

export type IntelligenceHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  intelligenceEnabled: boolean;
  lastAnalysisAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  componentsLearned: number;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type IntelligencePerformanceStats = {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  totalComponentsDiscovered: number;
  totalDeviationsDetected: number;
  averageAnalysisDurationMs: number;
  peakAnalysisDurationMs: number;
};

export type IntelligenceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type DesignSystemIntelligenceState = {
  engineVersion: DesignSystemIntelligenceEngineVersion;
  missionId: "T2-02";
  status: IntelligenceStatus;
  initializedAt: string;
  configuration: DesignSystemIntelligenceConfiguration;
  latestModel: DesignSystemModel | null;
  latestReport: DesignSystemAnalysisReport | null;
  health: IntelligenceHealthReport;
  performance: IntelligencePerformanceStats;
};

export type DesignSystemIntelligenceCockpitSnapshot = {
  intelligenceStatus: IntelligenceStatus;
  healthStatus: string;
  designSystemVersion: string | null;
  componentsLearned: number;
  familiesIdentified: number;
  lastDecision: ValidationDecision | null;
  deviationsCount: number;
  totalAnalyses: number;
  recentLogs: string[];
};

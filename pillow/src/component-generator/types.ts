/** PILLOW-CG-001 — Component Generator types (T3-02). */

import type {
  COMPONENT_CATEGORIES,
  ENGINE_STATUSES,
  GENERATION_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { ComponentGeneratorConfiguration } from "./configuration.js";

export type ComponentGeneratorEngineVersion = "PILLOW-CG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];
export type ComponentCategory = (typeof COMPONENT_CATEGORIES)[number];

export type SafetyCheck = {
  checkId: string;
  checkName: string;
  passed: boolean;
  details: string;
};

export type ComponentVariant = {
  variantId: string;
  variantName: string;
  description: string;
};

export type ComponentState = {
  stateId: string;
  stateName: string;
  description: string;
};

export type RegistryUpdate = {
  registryId: string;
  componentName: string;
  action: "register" | "skip_duplicate";
  targetPath: string;
};

export type ComponentGenerationRecord = {
  componentGenerationId: string;
  timestamp: string;
  sourceRecommendationId: string;
  sourceFrontendBuildRecordId: string | null;
  sourceDesignSystemId: string | null;
  sourceExecutiveStyleId: string | null;
  componentName: string;
  componentCategory: ComponentCategory;
  componentPurpose: string;
  targetFiles: string[];
  generatedComponentCode: string;
  generatedPropsOrInterface: string;
  generatedVariants: ComponentVariant[];
  generatedStates: ComponentState[];
  generatedStyling: string[];
  usageExamples: string[];
  registryUpdates: RegistryUpdate[];
  safetyChecks: SafetyCheck[];
  generationStatus: GenerationStatus;
  confidenceScore: number;
  metadataVersion: string;
};

export type ComponentGenerationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  recordsValidated: number;
  categoriesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ComponentGenerationReport = {
  componentGenerationReportId: string;
  generationTimestamp: string;
  records: ComponentGenerationRecord[];
  validation: ComponentGenerationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ComponentGeneratorHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  generatorEnabled: boolean;
  generationsCompleted: number;
  lastGenerationAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ComponentGeneratorPerformanceStats = {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalComponentsGenerated: number;
  duplicatesSkipped: number;
  averageComponentsPerGeneration: number;
  averageGenerationDurationMs: number;
  peakGenerationDurationMs: number;
};

export type ComponentGeneratorLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ComponentGeneratorState = {
  engineVersion: ComponentGeneratorEngineVersion;
  missionId: "T3-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: ComponentGeneratorConfiguration;
  latestReport: ComponentGenerationReport | null;
  health: ComponentGeneratorHealthReport;
  performance: ComponentGeneratorPerformanceStats;
};

export type ComponentGeneratorCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: string;
  lastDecision: ValidationDecision | null;
  componentsCount: number;
  validatedCount: number;
  blockedCount: number;
  duplicatesSkipped: number;
  confidenceScore: number;
  totalGenerations: number;
  recentLogs: string[];
};

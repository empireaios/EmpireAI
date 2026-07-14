/** PILLOW-MPG-001 — Multi-Proposal Generator types (T4-04). */

import type {
  ENGINE_STATUSES,
  GENERATION_STATUSES,
  IMPLEMENTATION_SCOPES,
  PROPOSAL_CATEGORIES,
  PROPOSAL_DECISIONS,
} from "./paths.js";
import type { MultiProposalGeneratorConfiguration } from "./configuration.js";

export type MultiProposalGeneratorEngineVersion = "PILLOW-MPG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type GenerationStatus = (typeof GENERATION_STATUSES)[number];
export type ProposalCategory = (typeof PROPOSAL_CATEGORIES)[number];
export type ProposalDecision = (typeof PROPOSAL_DECISIONS)[number];
export type ImplementationScope = (typeof IMPLEMENTATION_SCOPES)[number];

export type RedesignProposalRecord = {
  proposalId: string;
  timestamp: string;
  sourceConversationIntentId: string | null;
  sourceVoiceCommandId: string | null;
  sourceAnnotationId: string | null;
  sourcePointAndEditIntentId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  targetComponentIds: string[];
  targetLayoutRegionIds: string[];
  targetNavigationNodeIds: string[];
  proposalCategory: ProposalCategory;
  proposalTitle: string;
  proposalSummary: string;
  proposedUxChange: string;
  expectedUxBenefit: string;
  linkedUxFindingIds: string[];
  linkedBuilderCapabilities: string[];
  estimatedImplementationScope: ImplementationScope;
  riskNotes: string | null;
  confidenceScore: number;
  metadataVersion: string;
};

export type ProposalGenerationSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  proposals: RedesignProposalRecord[];
  status: GenerationStatus;
};

export type ProposalGenerationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ProposalDecision;
  proposalsGenerated: number;
  categoriesCovered: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ProposalGenerationRunReport = {
  proposalGenerationRunReportId: string;
  runTimestamp: string;
  session: ProposalGenerationSession;
  proposals: RedesignProposalRecord[];
  validation: ProposalGenerationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ProposalGeneratorHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  generatorEnabled: boolean;
  generationsCompleted: number;
  lastGenerationAt: string | null;
  lastGenerationDecision: ProposalDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ProposalGeneratorPerformanceStats = {
  totalGenerations: number;
  successfulGenerations: number;
  failedGenerations: number;
  totalProposalsGenerated: number;
  averageProposalsPerRun: number;
  uxFindingsLinked: number;
  builderCapabilitiesLinked: number;
  averageGenerationDurationMs: number;
  peakGenerationDurationMs: number;
};

export type ProposalGeneratorLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MultiProposalGeneratorState = {
  engineVersion: MultiProposalGeneratorEngineVersion;
  missionId: "T4-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: MultiProposalGeneratorConfiguration;
  latestReport: ProposalGenerationRunReport | null;
  health: ProposalGeneratorHealthReport;
  performance: ProposalGeneratorPerformanceStats;
};

export type MultiProposalGeneratorCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ProposalGeneratorHealthReport["status"];
  lastDecision: ProposalDecision | null;
  activeSessions: number;
  totalGenerations: number;
  totalProposals: number;
  categoriesCovered: number;
  confidenceScore: number;
  recentLogs: string[];
};

/** Input for a multi-proposal generation run. */
export type ProposalGenerationInput = {
  sessionId?: string;
  sourceConversationIntentId?: string | null;
  sourceVoiceCommandId?: string | null;
  sourceAnnotationId?: string | null;
  sourcePointAndEditIntentId?: string | null;
  targetScreenId?: string | null;
  targetRouteOrViewId?: string | null;
  preferredCategories?: ProposalCategory[];
};

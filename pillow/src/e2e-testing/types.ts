/** PILLOW-E2E-001 — End-to-End Testing Architecture types (P4-07). */

import type {
  CRITICAL_JOURNEY_IDS,
  DEPLOYMENT_TEST_PIPELINE,
  MANDATORY_E2E_JOURNEYS,
  TEST_TYPES,
  TESTING_PYRAMID,
} from "./paths.js";

export type TestingPyramidLayer = (typeof TESTING_PYRAMID)[number];
export type TestType = (typeof TEST_TYPES)[number];
export type DeploymentTestStage = (typeof DEPLOYMENT_TEST_PIPELINE)[number];
export type MandatoryJourneyId = (typeof MANDATORY_E2E_JOURNEYS)[number];
export type CriticalJourneyId = (typeof CRITICAL_JOURNEY_IDS)[number];
export type JourneyVerdict = "PASS" | "FAIL" | "PENDING" | "SKIPPED";

export interface E2eTestingState {
  engineVersion: "PILLOW-E2E-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  totalExecutions: number;
  lastExecution: E2eTestExecutionResult | null;
}

export interface E2eTestingRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
  dryRun?: boolean;
  environment?: "local" | "ci" | "production";
}

export interface E2eBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: E2eReadinessPipeline;
}

export interface E2eReadinessPipeline {
  pipelineVersion: "P4-07";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  journeyRegistryComplete: boolean;
  repositoryTestsAvailable: boolean;
  browserTruthAligned: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface JourneyDefinition {
  id: MandatoryJourneyId;
  label: string;
  critical: boolean;
  layer: TestingPyramidLayer;
  testType: TestType;
  runner: string;
  browserTruthFinal: boolean;
}

export interface JourneyResult {
  id: MandatoryJourneyId;
  label: string;
  critical: boolean;
  verdict: JourneyVerdict;
  detail: string;
  evidence: string[];
}

export interface TestEvidenceRecord {
  testId: string;
  executionTime: string;
  environment: string;
  repositoryVersion: string;
  commit: string;
  roadmapItem: string;
  verdict: JourneyVerdict;
  evidence: string[];
  screenshots: string[];
  logs: string[];
  knownIssues: string[];
}

export interface FailurePolicyResult {
  blockProductionAcceptance: boolean;
  notifySupervisor: boolean;
  notifyPillow: boolean;
  generateRecoveryRecommendation: boolean;
  preventMissionCompletion: boolean;
  reason: string;
}

export interface E2eTestExecutionResult {
  pipelineVersion: "P4-07";
  executedAt: string;
  dryRun: boolean;
  environment: string;
  stages: Array<{ stage: DeploymentTestStage; status: JourneyVerdict; detail: string }>;
  journeys: JourneyResult[];
  criticalFailures: JourneyResult[];
  passRate: number;
  evidence: TestEvidenceRecord[];
  failurePolicy: FailurePolicyResult | null;
  browserTruthAuthority: "P4-06 remains final acceptance authority";
  success: boolean;
  acceptanceSummary: string;
}

export interface E2eTestingMetrics {
  passRate: number;
  criticalFailures: number;
  regressionCount: number;
  coverageEstimate: number;
  flakyTestCount: number;
  averageExecutionMs: number;
  trend: "improving" | "stable" | "degrading";
}

export interface E2eTestingAnalysis {
  recurringFailures: string[];
  coverageGaps: string[];
  missingJourneys: string[];
  flakyTests: string[];
  regressionTrends: string[];
  recommendations: string[];
}

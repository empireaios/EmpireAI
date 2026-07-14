/** PILLOW-BT-001 — Browser Truth types (P4-06). */

import type {
  BROWSER_ACCEPTANCE_PIPELINE,
  BROWSER_VERIFICATION_DIMENSIONS,
  PRODUCTION_SCENARIOS,
} from "./paths.js";

export type BrowserAcceptanceStage = (typeof BROWSER_ACCEPTANCE_PIPELINE)[number];
export type BrowserVerificationDimension = (typeof BROWSER_VERIFICATION_DIMENSIONS)[number];
export type ProductionScenario = (typeof PRODUCTION_SCENARIOS)[number];
export type AcceptanceVerdict = "PASS" | "FAIL" | "PENDING";

export interface BrowserTruthState {
  engineVersion: "PILLOW-BT-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  productionUrl: string;
  totalVerifications: number;
  lastVerification: BrowserVerificationResult | null;
}

export interface BrowserTruthRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  featureTested?: string | null;
  grandKingOverride?: boolean;
  dryRun?: boolean;
}

export interface BrowserBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: BrowserReadinessPipeline;
}

export interface BrowserReadinessPipeline {
  pipelineVersion: "P4-06";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  productionTruthAligned: boolean;
  productionReachable: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface BrowserVerificationCheck {
  dimension: BrowserVerificationDimension;
  status: "passed" | "failed" | "skipped" | "pending";
  detail: string;
}

export interface ProductionScenarioResult {
  scenario: ProductionScenario;
  status: "passed" | "failed" | "skipped" | "pending";
  detail: string;
}

export interface BrowserEvidencePackage {
  browserScreenshots: string[];
  browserRecording: string | null;
  productionUrl: string;
  featureTested: string;
  testResults: string;
  observedBehaviour: string;
  knownLimitations: string[];
  acceptanceStatus: AcceptanceVerdict;
}

export interface TripleAcceptanceModel {
  repositoryAcceptance: AcceptanceVerdict;
  productionAcceptance: AcceptanceVerdict;
  grandKingAcceptance: AcceptanceVerdict;
  missionComplete: boolean;
  summary: string;
}

export interface BrowserVerificationResult {
  pipelineVersion: "P4-06";
  verifiedAt: string;
  productionUrl: string;
  dryRun: boolean;
  checks: BrowserVerificationCheck[];
  scenarios: ProductionScenarioResult[];
  evidence: BrowserEvidencePackage;
  acceptance: TripleAcceptanceModel;
  driftDetected: BrowserDriftReport;
  success: boolean;
}

export interface BrowserDriftReport {
  browserDrift: boolean;
  productionDrift: boolean;
  uxDrift: boolean;
  regression: boolean;
  findings: string[];
}

export interface BrowserTruthMetrics {
  validationPassRate: number;
  failedBrowserChecks: number;
  regressionRate: number;
  productionAcceptanceRate: number;
  grandKingAcceptanceRate: number;
  trend: "improving" | "stable" | "degrading";
}

export interface BrowserTruthComparison {
  repositoryBehaviour: string;
  productionBehaviour: string;
  browserBehaviour: string;
  expectedBehaviour: string;
  aligned: boolean;
  findings: string[];
}

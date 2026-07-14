/** PILLOW-ZHA-001 — Zero-Human Automation types (P6-07). */

import type {
  AUTOMATION_DOMAINS,
  AUTOMATION_LEVELS,
  AUTOMATION_PIPELINE_STAGES,
  AUTOMATION_SAFETY_STOPS,
} from "./paths.js";

export type AutomationDomain = (typeof AUTOMATION_DOMAINS)[number];
export type AutomationLevel = (typeof AUTOMATION_LEVELS)[number];
export type AutomationPipelineStage = (typeof AUTOMATION_PIPELINE_STAGES)[number];
export type AutomationSafetyStop = (typeof AUTOMATION_SAFETY_STOPS)[number];

export interface ZeroHumanAutomationRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  grandKingOverride?: boolean;
}

export interface SubsystemAutomationLevel {
  subsystemId: string;
  label: string;
  currentLevel: AutomationLevel;
  targetLevel: AutomationLevel;
  upgradeRequirements: string[];
  safetyConstraints: string[];
}

export interface AutomationPipelineStageRecord {
  stage: AutomationPipelineStage;
  order: number;
  description: string;
}

export interface AutomationState {
  automationLevel: AutomationLevel;
  automationHealth: "healthy" | "degraded" | "blocked" | "stopped";
  activeAutomation: string | null;
  queuedAutomation: number;
  successRate: number;
  failureCount: number;
  recoveryStatus: string;
  safetyStops: AutomationSafetyStop[];
  pipelineProgress: number;
}

export interface ZeroHumanAutomationReadinessPipeline {
  pipelineVersion: "P6-07";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  pipelineDocumented: boolean;
  levelsRegistryReady: boolean;
  safetyModelReady: boolean;
  eccIntegrationReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface ZeroHumanAutomationGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: ZeroHumanAutomationReadinessPipeline;
}

export interface ZeroHumanAutomationEngineState {
  engineVersion: "PILLOW-ZHA-001";
  status: "ready" | "degraded" | "blocked" | "stopped";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  surfacesAttached: boolean;
  currentAutomationLevel: AutomationLevel;
  lastState: AutomationState | null;
}

export interface ZeroHumanAutomationAssessment {
  success: boolean;
  automationQuality: "effective" | "improving" | "degraded" | "unknown";
  lastState: AutomationState | null;
  recommendations: string[];
  grandKingSummary: string;
}

export interface ZeroHumanAutomationMetrics {
  totalDomains: number;
  pipelineStages: number;
  automationLevels: number;
  safetyStops: number;
  readinessScore: number;
  successRate: number;
  subsystemCount: number;
  trend: "stable" | "improving" | "degrading";
}

export interface ZeroHumanAutomationAnalysis {
  automationOpportunities: string[];
  automationQuality: string[];
  automationSafety: string[];
  automationEfficiency: string[];
  automationDrift: string[];
  recommendations: string[];
}

export interface PhaseP6ReviewFinding {
  id: string;
  area: string;
  classification: "critical" | "high" | "medium" | "low";
  summary: string;
}

export interface PhaseP6CompletionReview {
  complete: boolean;
  items: Array<{ id: string; label: string; status: "complete" | "partial" | "gap" }>;
  findings: PhaseP6ReviewFinding[];
}

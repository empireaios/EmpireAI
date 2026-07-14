/** PILLOW-JR-001 — Journey System types (P4-08). */

import type {
  JOURNEY_EVENT_TYPES,
  JOURNEY_MODEL,
  JOURNEY_RELATIONSHIP_CHAIN,
  MISSION_TRACEABILITY_FIELDS,
} from "./paths.js";

export type JourneyModelStage = (typeof JOURNEY_MODEL)[number];
export type MissionTraceabilityField = (typeof MISSION_TRACEABILITY_FIELDS)[number];
export type JourneyRelationshipLink = (typeof JOURNEY_RELATIONSHIP_CHAIN)[number];
export type JourneyEventType = (typeof JOURNEY_EVENT_TYPES)[number];

export interface JourneySystemState {
  engineVersion: "PILLOW-JR-001";
  status: "ready" | "degraded" | "blocked";
  initializedAt: string;
  doctrinePath: string;
  companionPath: string;
  totalJourneys: number;
  activeJourneyId: string | null;
  lastTraceability: MissionTraceabilityRecord | null;
}

export interface JourneySystemRequest {
  missionId?: string | null;
  missionTitle?: string | null;
  roadmapItem?: string | null;
  phase?: string | null;
  grandKingOverride?: boolean;
}

export interface JourneyBuilderGateResult {
  allowed: boolean;
  reason: string;
  overrideApplied: boolean;
  readinessScore: number;
  pipeline: JourneyReadinessPipeline;
}

export interface JourneyReadinessPipeline {
  pipelineVersion: "P4-08";
  success: boolean;
  readinessScore: number;
  doctrinePresent: boolean;
  journeyIndexPresent: boolean;
  traceabilityReady: boolean;
  timelineReady: boolean;
  recommendedAction: string;
  steps: Array<{ label: string; status: string; summary: string }>;
}

export interface JourneyRelationship {
  link: JourneyRelationshipLink;
  artifact: string;
  detail: string;
}

export interface JourneyTimelineEvent {
  id: string;
  at: string;
  type: JourneyEventType;
  stage: JourneyModelStage | "timeline";
  label: string;
  detail: string;
  actor: "builder" | "supervisor" | "pillow" | "grand_king" | "system";
}

export interface MissionTraceabilityRecord {
  journeyId: string;
  missionId: string;
  roadmapItem: string;
  phase: string;
  purpose: string;
  why: string;
  what: string;
  how: string;
  proof: string;
  missionState: string;
  owner: string;
  startTime: string;
  finishTime: string | null;
  elapsedTime: string | null;
  eta: string | null;
  dependencies: string[];
  repositoryChanges: string[];
  architectureChanges: string[];
  productionChanges: string[];
  evidence: string[];
  lessonsLearned: string[];
  recoveryEvents: string[];
}

export interface JourneyRecord {
  journeyId: string;
  createdAt: string;
  archivedAt: string | null;
  status: "active" | "archived";
  currentStage: JourneyModelStage;
  currentRoadmapItem: string;
  currentMissionId: string | null;
  currentStep: string;
  progress: number;
  eta: string | null;
  relationships: JourneyRelationship[];
  timeline: JourneyTimelineEvent[];
  missions: MissionTraceabilityRecord[];
  milestones: string[];
  recoveryEvents: string[];
  validationEvents: string[];
  productionEvents: string[];
  grandKingDecisions: string[];
  pillowDecisions: string[];
  supervisorEvents: string[];
  lessonsLearned: string[];
  evidence: string[];
}

export interface EndToEndTraceResult {
  pipelineVersion: "P4-08";
  tracedAt: string;
  journeyId: string;
  complete: boolean;
  chain: Array<{ link: JourneyRelationshipLink; present: boolean; detail: string }>;
  summary: string;
  record: JourneyRecord;
}

export interface JourneySystemMetrics {
  totalJourneys: number;
  activeJourneys: number;
  archivedJourneys: number;
  traceabilityCompleteness: number;
  timelineEventCount: number;
  lessonsLearnedCount: number;
  trend: "improving" | "stable" | "degrading";
}

export interface JourneyGovernanceAnalysis {
  journeyCompleteness: number;
  journeyDrift: string[];
  missingEvidence: string[];
  missingDependencies: string[];
  lessonsLearned: string[];
  knowledgeGrowth: string[];
  recommendations: string[];
}

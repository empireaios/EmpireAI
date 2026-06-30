/** PILLOW-012 — Autonomous Improvement Engine types. */

import type { DueDiligenceRecommendation } from "../due-diligence/types.js";
import type { RecommendationPriority } from "../due-diligence/types.js";

export type ImprovementDomain =
  | "repository_architecture"
  | "engineering_architecture"
  | "commercial_architecture"
  | "mission_planning"
  | "journey"
  | "repository_synchronization"
  | "recovery"
  | "automation"
  | "executive_governance"
  | "ux"
  | "real_owners"
  | "global_components"
  | "executive_components"
  | "pillow"
  | "other";

export type ImprovementLifecycleStage =
  | "observation"
  | "evidence_collection"
  | "impact_analysis"
  | "priority_assessment"
  | "dependency_verification"
  | "implementation_proposal"
  | "grand_king_approval"
  | "mission_generation"
  | "execution"
  | "executive_audit_review"
  | "repository_synchronization";

export type MissionReadiness =
  | "ready_for_implementation"
  | "blocked_by_dependencies"
  | "requires_repository_synchronization"
  | "requires_architecture_review"
  | "requires_grand_king_decision"
  | "requires_further_investigation";

export type ImprovementApprovalOutcome =
  | "approved"
  | "rejected"
  | "deferred"
  | "request_revision";

export interface ImprovementProposal {
  proposalId: string;
  title: string;
  objective: string;
  reason: string;
  domain: ImprovementDomain;
  repositoryEvidence: string[];
  affectedOwners: string[];
  affectedContracts: string[];
  affectedModules: string[];
  expectedBenefits: string;
  expectedRisks: string[];
  estimatedEngineeringEffort: "low" | "medium" | "high" | "critical";
  estimatedCommercialImpact: "none" | "low" | "medium" | "high" | "critical";
  recommendedPriority: RecommendationPriority;
  recommendedMissionSequence: string[];
  readiness: MissionReadiness;
  lifecycleStage: ImprovementLifecycleStage;
  dependencyChecks: DependencyCheck[];
  sourceObservationId: string;
  requiresGrandKingApproval: true;
  createdAt: string;
}

export interface DependencyCheck {
  id: string;
  label: string;
  satisfied: boolean;
  required: boolean;
}

export interface ImprovementApproval {
  proposalId: string;
  outcome: ImprovementApprovalOutcome;
  decidedAt: string;
  decidedBy: "grand_king";
  notes?: string;
}

export interface ImprovementBatch {
  batchId: string;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  proposals: ImprovementProposal[];
  observationCount: number;
}

export interface ImprovementEngineState {
  engineVersion: "PILLOW-012";
  status: "ready";
  initializedAt: string;
  doctrinePath: string;
  totalBatches: number;
  totalProposals: number;
  lastBatch: ImprovementBatch | null;
}

export interface ImprovementEngineOptions {
  maxProposals?: number;
}

export interface GenerateImprovementsRequest {
  observations?: DueDiligenceRecommendation[];
  runDueDiligence?: boolean;
}

export interface ImprovementExecutionResult {
  batch: ImprovementBatch;
  recommendation: string;
}

/** PILLOW-009 — Executive Audit Reviewer types. */

import type { CursorMissionDocument } from "../planner/types.js";
import type { RepositoryInspection } from "../recovery/types.js";
import type { SupervisedMission } from "../supervisor/types.js";
import type { ValidationCycleResult } from "../recovery/types.js";

export type ReviewDecision =
  | "approved"
  | "approved_with_recommendations"
  | "conditionally_approved"
  | "rejected"
  | "manual_review_required";

export type CriterionResult =
  | "passed"
  | "partially_passed"
  | "failed"
  | "unable_to_verify";

export type ReviewCategory =
  | "contract_compliance"
  | "acceptance_compliance"
  | "architecture_compliance"
  | "repository_ownership"
  | "component_reuse"
  | "dependency_compliance"
  | "validation_quality"
  | "repository_continuity"
  | "governance_compliance"
  | "engineering_completeness";

export type RecommendationKind =
  | "mandatory_correction"
  | "future_enhancement"
  | "repository_improvement"
  | "architecture_improvement"
  | "commercial_improvement"
  | "governance_improvement";

export interface CategoryReviewResult {
  category: ReviewCategory;
  result: CriterionResult;
  score: number;
  findings: string[];
}

export interface AcceptanceCriterionReview {
  id: string;
  label: string;
  result: CriterionResult;
  detail: string;
}

export interface ReviewRecommendation {
  kind: RecommendationKind;
  summary: string;
  blocksApproval: boolean;
}

export interface ReviewRequest {
  mission: SupervisedMission;
  missionDocument?: CursorMissionDocument | null;
  auditText?: string | null;
  implementationSummary?: string | null;
  validation?: ValidationCycleResult | null;
  typecheckPassed?: boolean;
  buildPassed?: boolean;
}

export interface ReviewRecord {
  recordId: string;
  missionId: string;
  missionTitle: string;
  decision: ReviewDecision;
  reasoning: string;
  categories: CategoryReviewResult[];
  acceptanceCriteria: AcceptanceCriterionReview[];
  recommendations: ReviewRecommendation[];
  inspection: RepositoryInspection;
  auditStandardPath: string;
  invokedBy: "cursor_supervisor";
  startedAt: string;
  completedAt: string;
  durationMs: number;
}

export interface ReviewExecutionResult {
  record: ReviewRecord;
  approved: boolean;
  plannerEligible: boolean;
  recommendation: string;
}

export interface ExecutiveAuditReviewerState {
  reviewerVersion: "PILLOW-009";
  status: "ready";
  initializedAt: string;
  auditStandardPath: string;
  totalReviews: number;
  lastReview: ReviewRecord | null;
}

export interface ExecutiveAuditReviewerOptions {
  dryRunValidation?: boolean;
}

export function isApprovalDecision(decision: ReviewDecision): boolean {
  return (
    decision === "approved" ||
    decision === "approved_with_recommendations" ||
    decision === "conditionally_approved"
  );
}

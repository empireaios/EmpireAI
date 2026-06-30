import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import { inspectRepositoryState } from "../recovery/inspector.js";
import {
  verifyAcceptanceCriteria,
  verifyDependencyCompliance,
} from "./acceptance-verifier.js";
import {
  verifyArchitectureCompliance,
  verifyComponentReuse,
} from "./architecture-verifier.js";
import { verifyContractCompliance } from "./contract-verifier.js";
import { determineReviewDecision } from "./decision-engine.js";
import { categorizeRecommendations } from "./recommendation-engine.js";
import {
  verifyEngineeringCompleteness,
  verifyGovernanceCompliance,
  verifyRepositoryContinuity,
  verifyRepositoryOwnership,
} from "./repository-verifier.js";
import type {
  ExecutiveAuditReviewerOptions,
  ExecutiveAuditReviewerState,
  ReviewExecutionResult,
  ReviewRecord,
  ReviewRequest,
} from "./types.js";
import { isApprovalDecision } from "./types.js";
import { verifyValidationQuality } from "./validation-verifier.js";

export const AUDIT_STANDARD_PATH = "EMPIREAI_EXECUTIVE_AUDIT_STANDARD.md";

/**
 * Executive Audit Reviewer (PILLOW-009).
 * Mandatory quality gate before mission completion. Read-only — evaluates only.
 */
export class ExecutiveAuditReviewerEngine {
  private initializedAt: string | null = null;
  private history: ReviewRecord[] = [];

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private options: ExecutiveAuditReviewerOptions = {},
  ) {}

  async initialize(): Promise<ExecutiveAuditReviewerState> {
    const reader = new RepositoryReader(this.bootstrap.repositoryRoot);
    const text = await reader.readText(AUDIT_STANDARD_PATH);
    if (!text?.includes("Owner Justification")) {
      throw new Error(
        `${AUDIT_STANDARD_PATH} missing — Executive Audit Reviewer requires Audit Standard.`,
      );
    }
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): ExecutiveAuditReviewerState {
    if (!this.initializedAt) {
      throw new Error(
        "Executive Audit Reviewer not initialized. Call initialize() first.",
      );
    }
    return {
      reviewerVersion: "PILLOW-009",
      status: "ready",
      initializedAt: this.initializedAt,
      auditStandardPath: AUDIT_STANDARD_PATH,
      totalReviews: this.history.length,
      lastReview: this.history.at(-1) ?? null,
    };
  }

  /** Full review procedure — invoked by Cursor Supervisor only. */
  async reviewMission(request: ReviewRequest): Promise<ReviewExecutionResult> {
    const started = performance.now();
    const startedAt = new Date().toISOString();
    void this.options;

    const inspection = await inspectRepositoryState(this.bootstrap.repositoryRoot);

    const contract = verifyContractCompliance(request.mission, request.auditText);
    const { category: acceptance, criteria } = verifyAcceptanceCriteria(
      request.mission,
      request.auditText,
    );
    const dependencies = verifyDependencyCompliance(request.mission);
    const architecture = verifyArchitectureCompliance(
      request.mission,
      inspection,
      request.auditText,
    );
    const componentReuse = verifyComponentReuse(request.auditText);
    const validation = verifyValidationQuality(
      request.mission,
      request.auditText,
      request.validation,
      request.typecheckPassed,
      request.buildPassed,
    );
    const repositoryContinuity = verifyRepositoryContinuity(
      inspection,
      request.auditText,
    );
    const repositoryOwnership = verifyRepositoryOwnership(inspection);
    const governance = verifyGovernanceCompliance(request.auditText);
    const engineering = verifyEngineeringCompleteness(
      request.auditText,
      request.mission.validationCompleted,
    );

    const categories = [
      contract,
      acceptance,
      architecture,
      repositoryOwnership,
      componentReuse,
      dependencies,
      validation,
      repositoryContinuity,
      governance,
      engineering,
    ];

    const recommendations = categorizeRecommendations(request.auditText, categories);
    const acceptanceFailed = criteria.some((c) => c.result === "failed");

    const { decision, reasoning } = determineReviewDecision(
      categories,
      recommendations,
      acceptanceFailed,
    );

    const approved = isApprovalDecision(decision);
    const plannerEligible = approved && decision !== "conditionally_approved";

    let recommendation: string;
    if (approved) {
      recommendation =
        decision === "conditionally_approved"
          ? "Mission conditionally approved — address noted items before next mission"
          : "Mission approved — Mission Planner eligible for next mission";
    } else if (decision === "manual_review_required") {
      recommendation = "Escalate to Grand King — Recovery Manager or Mission Planner determines corrective action";
    } else {
      recommendation =
        "Mission rejected — Recovery Manager or Mission Planner determines corrective action";
    }

    const record: ReviewRecord = {
      recordId: randomUUID(),
      missionId: request.mission.id,
      missionTitle: request.mission.title,
      decision,
      reasoning,
      categories,
      acceptanceCriteria: criteria,
      recommendations,
      inspection,
      auditStandardPath: AUDIT_STANDARD_PATH,
      invokedBy: "cursor_supervisor",
      startedAt,
      completedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
    };

    this.history.push(record);

    return { record, approved, plannerEligible, recommendation };
  }

  getHistory(missionId?: string): ReviewRecord[] {
    if (missionId) return this.history.filter((r) => r.missionId === missionId);
    return [...this.history];
  }

  getLastReview(missionId?: string): ReviewRecord | null {
    const list = missionId ? this.getHistory(missionId) : this.history;
    return list.at(-1) ?? null;
  }
}

export function createExecutiveAuditReviewerEngine(
  bootstrap: EmpireBootstrapContext,
  options?: ExecutiveAuditReviewerOptions,
): ExecutiveAuditReviewerEngine {
  return new ExecutiveAuditReviewerEngine(bootstrap, options);
}

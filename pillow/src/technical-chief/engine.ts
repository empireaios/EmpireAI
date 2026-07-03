import { randomUUID } from "node:crypto";
import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import type { RepositoryIntelligenceContext } from "../intelligence/types.js";
import { diagnoseSystemIssue } from "./diagnosis-engine.js";
import { buildEngineeringPlan } from "./engineering-planner.js";
import { analyzeRootCause } from "./root-cause-analyzer.js";
import { assessEngineeringRisk } from "./risk-assessor.js";
import { validateImplementation } from "./implementation-validator.js";
import { reviewCursorEngineeringOutput } from "./cursor-review-engine.js";
import {
  certifyEngineeringWork,
  formatExecutiveEngineeringReport,
} from "./certification-engine.js";
import type {
  ExecutiveEngineeringReport,
  TechnicalChiefAnalysisRequest,
  TechnicalChiefAnalysisResult,
  TechnicalChiefState,
} from "./types.js";

export const TECHNICAL_CHIEF_CONTRACT_PATH = "PILLOW_ARCHITECTURE_CONTRACT.md";

/**
 * Technical Chief (PILLOW-TC-001 / Phase 3).
 * Permanent engineering authority — diagnosis, RCA, planning, risk, validation, Cursor review, certification.
 */
export class TechnicalChiefEngine {
  private initializedAt: string | null = null;
  private totalAnalyses = 0;
  private totalCertifications = 0;
  private lastAnalysisId: string | null = null;
  private analysisHistory: TechnicalChiefAnalysisResult[] = [];

  constructor(
    private bootstrap: EmpireBootstrapContext,
    private intelligence: RepositoryIntelligenceContext,
  ) {}

  async initialize(): Promise<TechnicalChiefState> {
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): TechnicalChiefState {
    if (!this.initializedAt) {
      throw new Error("Technical Chief not initialized. Call initialize() first.");
    }
    return {
      chiefVersion: "PILLOW-TC-001",
      status: "ready",
      initializedAt: this.initializedAt,
      totalAnalyses: this.totalAnalyses,
      totalCertifications: this.totalCertifications,
      lastAnalysisId: this.lastAnalysisId,
    };
  }

  /** Full Technical Chief analysis — diagnosis through engineering plan and risk. */
  analyzeIssue(request: TechnicalChiefAnalysisRequest): TechnicalChiefAnalysisResult {
    const started = performance.now();
    const analysisId = randomUUID();

    const diagnosis = diagnoseSystemIssue(request.problemDescription, this.intelligence);
    const rootCause = analyzeRootCause(
      request.problemDescription,
      diagnosis,
      this.intelligence,
    );
    const plan = buildEngineeringPlan(request.problemDescription, diagnosis, rootCause);
    const risks = assessEngineeringRisk(diagnosis, rootCause, plan);

    const executiveBrief = formatAnalysisBrief(diagnosis, rootCause, plan, risks);

    const result: TechnicalChiefAnalysisResult = {
      analysisId,
      analyzedAt: new Date().toISOString(),
      durationMs: Math.round(performance.now() - started),
      diagnosis,
      rootCause,
      plan,
      risks,
      executiveBrief,
    };

    this.totalAnalyses += 1;
    this.lastAnalysisId = analysisId;
    this.analysisHistory.push(result);
    if (this.analysisHistory.length > 50) this.analysisHistory.shift();

    return result;
  }

  /** Certify engineering work after validation and Cursor review. */
  certifyWork(input: {
    problemDescription: string;
    changedFiles: string[];
    diffSummary?: string;
    validationOverrides?: Partial<{
      hasTypecheckPass: boolean;
      hasTestsPass: boolean;
      hasBuildPass: boolean;
      productionHealthOk: boolean;
      pillowSessionOk: boolean;
    }>;
  }): ExecutiveEngineeringReport {
    const analysis = this.analyzeIssue({
      problemDescription: input.problemDescription,
      changedFiles: input.changedFiles,
    });

    const cursorReview = reviewCursorEngineeringOutput({
      changedFiles: input.changedFiles,
      diffSummary: input.diffSummary,
    });

    const validation = validateImplementation({
      changedFiles: input.changedFiles,
      hasTypecheckPass: input.validationOverrides?.hasTypecheckPass ?? true,
      hasTestsPass: input.validationOverrides?.hasTestsPass ?? true,
      hasBuildPass: input.validationOverrides?.hasBuildPass ?? true,
      productionHealthOk: input.validationOverrides?.productionHealthOk ?? false,
      pillowSessionOk: input.validationOverrides?.pillowSessionOk ?? false,
    });

    const report = certifyEngineeringWork({
      summary: `Technical Chief certification for: ${input.problemDescription.slice(0, 120)}`,
      diagnosis: analysis.diagnosis,
      rootCause: analysis.rootCause,
      plan: analysis.plan,
      risks: analysis.risks,
      validation,
      cursorReview,
      filesChanged: input.changedFiles,
    });

    this.totalCertifications += 1;
    return report;
  }

  formatReport(report: ExecutiveEngineeringReport): string {
    return formatExecutiveEngineeringReport(report);
  }

  getLastAnalysis(): TechnicalChiefAnalysisResult | null {
    return this.analysisHistory.at(-1) ?? null;
  }
}

function formatAnalysisBrief(
  diagnosis: TechnicalChiefAnalysisResult["diagnosis"],
  rootCause: TechnicalChiefAnalysisResult["rootCause"],
  plan: TechnicalChiefAnalysisResult["plan"],
  risks: TechnicalChiefAnalysisResult["risks"],
): string {
  return [
    "--- Technical Chief Analysis (PILLOW-TC-001) ---",
    `Problem: ${diagnosis.summary}`,
    `Root cause (${Math.round(rootCause.confidenceScore * 100)}% confidence): ${rootCause.rootCause}`,
    `Recommended fix: ${plan.recommendedSolution}`,
    `Risk: ${risks.summary}`,
    `Validation: ${plan.validationPlan.slice(0, 3).join("; ")}`,
    `Rollback: ${plan.rollbackStrategy}`,
  ].join("\n");
}

export function createTechnicalChiefEngine(
  bootstrap: EmpireBootstrapContext,
  intelligence: RepositoryIntelligenceContext,
): TechnicalChiefEngine {
  return new TechnicalChiefEngine(bootstrap, intelligence);
}

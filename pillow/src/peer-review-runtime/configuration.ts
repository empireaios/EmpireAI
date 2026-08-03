import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { REVIEW_CRITERIA, REVIEW_OUTCOMES } from "./paths.js";
import type { PeerReviewRecord } from "./types.js";

export type PeerReviewRuntimeConfiguration = {
  enabled: boolean;
  reviewRulesEnabled: boolean;
  selectionRulesEnabled: boolean;
  comparisonRulesEnabled: boolean;
  escalationRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  reviewOutcomes: string[];
  reviewCriteria: string[];
  minReviewerQualification: number;
  minAgreementForApproval: number;
  disagreementEscalationThreshold: number;
  highImpactRequiresReview: true;
  criticalImpactRequiresReview: true;
  seedReviews: PeerReviewRecord[];
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-21 hard boundaries — force-locked true. */
  neverReplaceWorkers: true;
  neverRewriteCompletedWork: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExecuteBusinessTasks: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveReviewTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

export const DEFAULT_SEED_REVIEWS: PeerReviewRecord[] = [];

export const DEFAULT_PEER_REVIEW_RUNTIME_CONFIGURATION: PeerReviewRuntimeConfiguration = {
  enabled: true,
  reviewRulesEnabled: true,
  selectionRulesEnabled: true,
  comparisonRulesEnabled: true,
  escalationRulesEnabled: true,
  validationRulesEnabled: true,
  reviewOutcomes: [...REVIEW_OUTCOMES],
  reviewCriteria: [...REVIEW_CRITERIA],
  minReviewerQualification: 55,
  minAgreementForApproval: 75,
  disagreementEscalationThreshold: 2,
  highImpactRequiresReview: true,
  criticalImpactRequiresReview: true,
  seedReviews: [],
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverReplaceWorkers: true,
  neverRewriteCompletedWork: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExecuteBusinessTasks: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveReviewTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildPeerReviewRuntimeConfiguration(
  repositoryRoot?: string,
  overrides: Partial<PeerReviewRuntimeConfiguration> = {},
): PeerReviewRuntimeConfiguration {
  let file: Partial<PeerReviewRuntimeConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "peer-review-runtime.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.PEER_REVIEW_RUNTIME_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.PEER_REVIEW_RUNTIME_RETRY_ATTEMPTS ?? "", 10);

  const mergedOutcomes = Array.from(
    new Set([
      ...DEFAULT_PEER_REVIEW_RUNTIME_CONFIGURATION.reviewOutcomes,
      ...(file.reviewOutcomes ?? []),
      ...(overrides.reviewOutcomes ?? []),
    ]),
  );
  const mergedCriteria = Array.from(
    new Set([
      ...DEFAULT_PEER_REVIEW_RUNTIME_CONFIGURATION.reviewCriteria,
      ...(file.reviewCriteria ?? []),
      ...(overrides.reviewCriteria ?? []),
    ]),
  );

  return {
    ...DEFAULT_PEER_REVIEW_RUNTIME_CONFIGURATION,
    ...file,
    ...overrides,
    reviewOutcomes: mergedOutcomes,
    reviewCriteria: mergedCriteria,
    seedReviews: (overrides.seedReviews ?? file.seedReviews ?? []).map((r) => ({
      ...r,
      reviewers: [...r.reviewers],
      reviewFindings: r.reviewFindings.map((f) => ({ ...f })),
      issuesFound: [...r.issuesFound],
      requiredRevisions: [...r.requiredRevisions],
      independentReviews: r.independentReviews.map((ir) => ({
        ...ir,
        findings: [...ir.findings],
        issues: [...ir.issues],
        criteriaScores: { ...ir.criteriaScores },
      })),
      disagreements: [...r.disagreements],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    highImpactRequiresReview: true,
    criticalImpactRequiresReview: true,
    neverReplaceWorkers: true,
    neverRewriteCompletedWork: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExecuteBusinessTasks: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveReviewTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

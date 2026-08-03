import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { EXPERIENCE_SOURCES } from "./paths.js";
import type { HistoricalExecutionEvent } from "./types.js";

export type ExperienceReplayEngineConfiguration = {
  enabled: boolean;
  learningRulesEnabled: boolean;
  validationRulesEnabled: boolean;
  experienceSources: string[];
  historicalCatalog: HistoricalExecutionEvent[];
  mistakeRepeatThreshold: number;
  retryPolicyAttempts: number;
  timeoutMs: number;
  loggingLevel: "error" | "warn" | "info" | "debug";
  /** Q0-14 hard boundaries — force-locked true. */
  neverExecuteWork: true;
  neverReplaceExecutionMemory: true;
  neverReplaceDecisionEngine: true;
  neverOverridePillow: true;
  neverOverrideGrandKing: true;
  neverExposeCredentials: true;
  neverExposeAuthenticationTokens: true;
  preserveExperienceTraceability: true;
  preserveAuditability: true;
  structuralSignalsOnly: true;
  maskSensitiveValues: true;
  neverLogSensitiveEnterpriseInformation: true;
};

/** Seeded historical execution catalog for offline replay learning. */
export const DEFAULT_HISTORICAL_CATALOG: HistoricalExecutionEvent[] = [
  {
    historyId: "hist-001",
    missionId: "Q0-05",
    businessId: "biz-executive-decisions",
    eventType: "mission_success",
    source: "successful_missions",
    outcome: "success",
    summary: "Decision Engine produced validated executive decision with clear rationale",
    factors: ["clear_intent", "validated_inputs", "bounded_authority"],
    grandKingFeedback: null,
    timestamp: "2026-06-01T10:00:00.000Z",
  },
  {
    historyId: "hist-002",
    missionId: "Q0-06",
    businessId: "biz-approvals",
    eventType: "grand_king_approval",
    source: "grand_king_approvals",
    outcome: "success",
    summary: "Approval Router routed high-risk action for Grand King approval successfully",
    factors: ["risk_classified", "escalation_path_clear", "audit_trail_complete"],
    grandKingFeedback: "Approved with continued audit visibility",
    timestamp: "2026-06-02T11:00:00.000Z",
  },
  {
    historyId: "hist-003",
    missionId: "Q0-07",
    businessId: "biz-recommendations",
    eventType: "grand_king_rejection",
    source: "grand_king_rejections",
    outcome: "rejected",
    summary: "Strategic recommendation rejected for insufficient risk controls",
    factors: ["missing_risk_controls", "weak_alternatives", "overconfident_score"],
    grandKingFeedback: "Reject until risk controls and alternatives are explicit",
    timestamp: "2026-06-03T12:00:00.000Z",
  },
  {
    historyId: "hist-004",
    missionId: "Q0-08",
    businessId: "biz-audit",
    eventType: "mission_failure",
    source: "failed_missions",
    outcome: "failure",
    summary: "Audit run failed because evidence packaging omitted rejection context",
    factors: ["incomplete_evidence", "missing_rejection_context", "rushed_validation"],
    grandKingFeedback: null,
    timestamp: "2026-06-04T13:00:00.000Z",
  },
  {
    historyId: "hist-005",
    missionId: "Q0-09",
    businessId: "biz-workforce",
    eventType: "mission_failure",
    source: "failed_missions",
    outcome: "failure",
    summary: "Workforce orchestration failed after repeating incomplete evidence packaging",
    factors: ["incomplete_evidence", "handoff_gaps", "missing_rejection_context"],
    grandKingFeedback: null,
    timestamp: "2026-06-05T14:00:00.000Z",
  },
  {
    historyId: "hist-006",
    missionId: "Q0-10",
    businessId: "biz-capability",
    eventType: "executive_decision",
    source: "executive_decisions",
    outcome: "partial",
    summary: "Capability registry decision partially accepted pending tool coverage",
    factors: ["tool_coverage_gap", "status_freshness"],
    grandKingFeedback: "Accept registry with follow-up on tool coverage",
    timestamp: "2026-06-06T15:00:00.000Z",
  },
  {
    historyId: "hist-007",
    missionId: "Q0-11",
    businessId: "biz-access",
    eventType: "audit_report",
    source: "audit_reports",
    outcome: "success",
    summary: "Access Manager audit confirmed no worker-logic execution occurred",
    factors: ["boundary_enforced", "access_trace_complete"],
    grandKingFeedback: null,
    timestamp: "2026-06-07T16:00:00.000Z",
  },
  {
    historyId: "hist-008",
    missionId: "Q0-12",
    businessId: "biz-routing",
    eventType: "worker_review",
    source: "worker_reviews",
    outcome: "corrected",
    summary: "Worker review corrected routing that ignored cost ceiling",
    factors: ["cost_ceiling_ignored", "tool_overselection"],
    grandKingFeedback: "Correct routing to honour cost ceilings",
    timestamp: "2026-06-08T17:00:00.000Z",
  },
  {
    historyId: "hist-009",
    missionId: "Q0-13",
    businessId: "biz-reasoning",
    eventType: "production_result",
    source: "production_results",
    outcome: "success",
    summary: "Collective reasoning improved decision quality before production commit",
    factors: ["multi_worker_challenge", "minority_opinions_preserved"],
    grandKingFeedback: "Continue multi-worker challenge before high-risk commits",
    timestamp: "2026-06-09T18:00:00.000Z",
  },
  {
    historyId: "hist-010",
    missionId: "Q0-07",
    businessId: "biz-recommendations",
    eventType: "grand_king_rejection",
    source: "grand_king_rejections",
    outcome: "rejected",
    summary: "Second rejection for overconfident recommendation without alternatives",
    factors: ["overconfident_score", "weak_alternatives", "missing_risk_controls"],
    grandKingFeedback: "Do not resubmit without alternatives and risk controls",
    timestamp: "2026-06-10T19:00:00.000Z",
  },
];

export const DEFAULT_EXPERIENCE_REPLAY_ENGINE_CONFIGURATION: ExperienceReplayEngineConfiguration = {
  enabled: true,
  learningRulesEnabled: true,
  validationRulesEnabled: true,
  experienceSources: [...EXPERIENCE_SOURCES],
  historicalCatalog: DEFAULT_HISTORICAL_CATALOG.map((h) => ({
    ...h,
    factors: [...h.factors],
  })),
  mistakeRepeatThreshold: 2,
  retryPolicyAttempts: 3,
  timeoutMs: 5000,
  loggingLevel: "info",
  neverExecuteWork: true,
  neverReplaceExecutionMemory: true,
  neverReplaceDecisionEngine: true,
  neverOverridePillow: true,
  neverOverrideGrandKing: true,
  neverExposeCredentials: true,
  neverExposeAuthenticationTokens: true,
  preserveExperienceTraceability: true,
  preserveAuditability: true,
  structuralSignalsOnly: true,
  maskSensitiveValues: true,
  neverLogSensitiveEnterpriseInformation: true,
};

export function buildExperienceReplayEngineConfiguration(
  repositoryRoot?: string,
  overrides: Partial<ExperienceReplayEngineConfiguration> = {},
): ExperienceReplayEngineConfiguration {
  let file: Partial<ExperienceReplayEngineConfiguration> = {};
  const candidate = repositoryRoot
    ? join(repositoryRoot, "config", "experience-replay-engine.config.json")
    : "";
  if (candidate && existsSync(candidate)) {
    try {
      file = JSON.parse(readFileSync(candidate, "utf8"));
    } catch {
      /* retain safe defaults */
    }
  }
  const timeout = Number.parseInt(process.env.EXPERIENCE_REPLAY_ENGINE_TIMEOUT_MS ?? "", 10);
  const retries = Number.parseInt(process.env.EXPERIENCE_REPLAY_ENGINE_RETRY_ATTEMPTS ?? "", 10);

  const mergedSources = Array.from(
    new Set([
      ...DEFAULT_EXPERIENCE_REPLAY_ENGINE_CONFIGURATION.experienceSources,
      ...(file.experienceSources ?? []),
      ...(overrides.experienceSources ?? []),
    ]),
  );

  return {
    ...DEFAULT_EXPERIENCE_REPLAY_ENGINE_CONFIGURATION,
    ...file,
    ...overrides,
    experienceSources: mergedSources,
    historicalCatalog: (overrides.historicalCatalog ??
      file.historicalCatalog ??
      DEFAULT_EXPERIENCE_REPLAY_ENGINE_CONFIGURATION.historicalCatalog).map((h) => ({
      ...h,
      factors: [...h.factors],
    })),
    ...(Number.isFinite(timeout) ? { timeoutMs: timeout } : {}),
    ...(Number.isFinite(retries) ? { retryPolicyAttempts: retries } : {}),
    neverExecuteWork: true,
    neverReplaceExecutionMemory: true,
    neverReplaceDecisionEngine: true,
    neverOverridePillow: true,
    neverOverrideGrandKing: true,
    neverExposeCredentials: true,
    neverExposeAuthenticationTokens: true,
    preserveExperienceTraceability: true,
    preserveAuditability: true,
    structuralSignalsOnly: true,
    maskSensitiveValues: true,
    neverLogSensitiveEnterpriseInformation: true,
  };
}

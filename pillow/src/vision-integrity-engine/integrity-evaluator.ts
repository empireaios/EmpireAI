import type { DriftFinding } from "../vision-synchronization/types.js";
import type {
  ApprovalStatus,
  IntegrityClassification,
  IntegrityEvaluationRecord,
  IntegrityReviewRecord,
} from "./types.js";
import { INTEGRITY_REVIEW_DIMENSIONS } from "./paths.js";

const CLASS_RANK: Record<IntegrityClassification, number> = {
  aligned: 0,
  minor_drift: 1,
  moderate_drift: 2,
  major_drift: 3,
  critical_drift: 4,
  unknown: 5,
};

export function classifyFromDriftFindings(
  findings: DriftFinding[],
): IntegrityClassification {
  if (findings.length === 0) return "aligned";
  const hasCritical = findings.some((f) => f.severity === "critical");
  const hasHigh = findings.some((f) => f.severity === "high");
  const hasMedium = findings.some((f) => f.severity === "medium");
  if (hasCritical) return "critical_drift";
  if (hasHigh) return "major_drift";
  if (hasMedium) return "moderate_drift";
  return "minor_drift";
}

export function approvalStatusFromClassification(
  classification: IntegrityClassification,
  grandKingOverride?: boolean,
): ApprovalStatus {
  if (grandKingOverride) return "approved";
  if (classification === "critical_drift") return "blocked";
  if (classification === "major_drift") return "conditional";
  return "approved";
}

export function buildIntegrityEvaluation(input: {
  classification: IntegrityClassification;
  findings: DriftFinding[];
  missionTitle?: string | null;
}): IntegrityEvaluationRecord {
  const evidence = input.findings.map((f) => `[${f.domain}] ${f.signal}`);
  const impact =
    input.classification === "critical_drift"
      ? "Constitutional Vision at risk — execution may permanently diverge from Empire direction"
      : input.classification === "major_drift"
        ? "Significant alignment gap — requires Grand King awareness before proceeding"
        : input.classification === "moderate_drift"
          ? "Partial drift detected — monitor during execution"
          : input.classification === "minor_drift"
            ? "Minor alignment gap — acceptable with documentation"
            : "Fully aligned with constitutional Vision";

  const recommendation =
    input.findings[0]?.recommendation ??
    (input.classification === "aligned"
      ? "Proceed — mission faithful to Vision"
      : "Resolve drift signals before scope expansion");

  return {
    classification: input.classification,
    reason: input.findings.length
      ? `${input.findings.length} drift signal(s) detected for ${input.missionTitle ?? "proposed mission"}`
      : "All constitutional alignment checks passed",
    evidence,
    impact,
    recommendation,
  };
}

export function buildIntegrityReview(input: {
  classification: IntegrityClassification;
  coherent: boolean;
  missionTitle?: string | null;
}): IntegrityReviewRecord[] {
  const aligned = input.classification === "aligned" || input.classification === "minor_drift";
  return INTEGRITY_REVIEW_DIMENSIONS.map((dimension) => ({
    dimension,
    summary: reviewSummaryForDimension(dimension, input.classification, input.missionTitle),
    aligned: dimension === "constitutional_impact" ? input.coherent && aligned : aligned,
  }));
}

function reviewSummaryForDimension(
  dimension: IntegrityReviewRecord["dimension"],
  classification: IntegrityClassification,
  missionTitle?: string | null,
): string {
  const title = missionTitle ?? "proposed mission";
  switch (dimension) {
    case "why":
      return classification === "aligned"
        ? `WHY aligned — ${title} serves constitutional Vision`
        : `WHY review required — drift may undermine Vision purpose`;
    case "what":
      return `WHAT scope evaluated — classification ${classification.replace(/_/g, " ")}`;
    case "how":
      return "HOW validated against engineering constitution and Cursor Protocol";
    case "proof":
      return "PROOF requires acceptance criteria and Grand King sign-off";
    case "business_impact":
      return classification === "critical_drift"
        ? "Business impact HIGH — may misdirect Empire capabilities"
        : "Business impact assessed via objective alignment";
    case "architecture_impact":
      return "Architecture impact checked against canonical architecture law";
    case "engineering_impact":
      return "Engineering impact validated via pre-mission constitutional gates";
    case "constitutional_impact":
      return `Constitutional impact: ${classification.replace(/_/g, " ")}`;
    case "long_term_vision_impact":
      return classification === "aligned"
        ? "Long-term Vision impact positive or neutral"
        : "Long-term Vision impact requires Grand King review";
    default:
      return "Review dimension evaluated";
  }
}

export function worseClassification(
  a: IntegrityClassification,
  b: IntegrityClassification,
): IntegrityClassification {
  return CLASS_RANK[a] >= CLASS_RANK[b] ? a : b;
}

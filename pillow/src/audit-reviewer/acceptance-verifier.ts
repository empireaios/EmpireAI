import { findSequenceEntry } from "../planner/sequencer.js";
import type { SupervisedMission } from "../supervisor/types.js";
import type {
  AcceptanceCriterionReview,
  CategoryReviewResult,
  CriterionResult,
} from "./types.js";

export function verifyAcceptanceCriteria(
  mission: SupervisedMission,
  auditText?: string | null,
): { category: CategoryReviewResult; criteria: AcceptanceCriterionReview[] } {
  const entry = findSequenceEntry(mission.id);
  const labels =
    entry?.acceptanceCriteria ??
    ["Mission objective achieved", "Validation pass", "Repository preservation"];

  const criteria: AcceptanceCriterionReview[] = labels.map((label, i) => {
    const id = `ac-${i + 1}`;
    let result: CriterionResult = "unable_to_verify";
    let detail = "No audit text provided";

    const labelLower = label.toLowerCase();
    if (auditText) {
      const auditLower = auditText.toLowerCase();
      const mentioned =
        auditLower.includes(labelLower.slice(0, 12)) ||
        auditLower.includes("acceptance criteria") ||
        auditLower.includes("acceptance verification");

      if (mentioned && /pass|✅|met|verified|complete/i.test(auditText)) {
        result = "passed";
        detail = "Referenced and marked satisfied in Executive Audit";
      } else if (mentioned) {
        result = "partially_passed";
        detail = "Referenced in Executive Audit but completion unclear";
      } else if (mission.validationCompleted && labelLower.includes("valid")) {
        result = "passed";
        detail = "Validation completed on mission record";
      } else {
        result = "failed";
        detail = `Criterion "${label}" not verified in Executive Audit`;
      }
    } else if (mission.validationCompleted && labelLower.includes("valid")) {
      result = "passed";
      detail = "Validation recorded on mission";
    }

    return { id, label, result, detail };
  });

  const passed = criteria.filter((c) => c.result === "passed").length;
  const failed = criteria.filter((c) => c.result === "failed").length;
  const partial = criteria.filter((c) => c.result === "partially_passed").length;

  let categoryResult: CriterionResult;
  if (failed > 0) categoryResult = "failed";
  else if (partial > 0) categoryResult = "partially_passed";
  else if (passed === criteria.length) categoryResult = "passed";
  else categoryResult = "unable_to_verify";

  const findings: string[] = [];
  for (const c of criteria) {
    if (c.result === "failed" || c.result === "partially_passed") {
      findings.push(`${c.label}: ${c.detail}`);
    }
  }

  return {
    category: {
      category: "acceptance_compliance",
      result: categoryResult,
      score: Math.round((passed / criteria.length) * 100),
      findings,
    },
    criteria,
  };
}

export function verifyDependencyCompliance(
  mission: SupervisedMission,
): CategoryReviewResult {
  const entry = findSequenceEntry(mission.id);
  const findings: string[] = [];
  if (!entry) {
    return {
      category: "dependency_compliance",
      result: "unable_to_verify",
      score: 0,
      findings: ["Mission not in sequence — dependencies not verifiable"],
    };
  }

  const unsatisfied = entry.prerequisites.filter(
    (p) => !mission.dependencies.includes(p),
  );
  if (unsatisfied.length > 0 && mission.dependencies.length > 0) {
    findings.push(`Prerequisites not reflected: ${unsatisfied.join(", ")}`);
  }

  return {
    category: "dependency_compliance",
    result: findings.length === 0 ? "passed" : "partially_passed",
    score: findings.length === 0 ? 100 : 70,
    findings,
  };
}

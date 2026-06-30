import type { RepositoryInspection } from "../recovery/types.js";
import type { SupervisedMission } from "../supervisor/types.js";
import type { CategoryReviewResult, CriterionResult } from "./types.js";

const DUPLICATE_PATTERNS = [
  /duplicate implementation/i,
  /reimplemented/i,
  /unnecessary redesign/i,
  /architecture drift/i,
];

export function verifyArchitectureCompliance(
  mission: SupervisedMission,
  inspection: RepositoryInspection,
  auditText?: string | null,
): CategoryReviewResult {
  const findings: string[] = [];
  let score = 100;

  const createdInPillow = inspection.createdFiles.filter((f) =>
    f.startsWith("pillow/"),
  );
  const modifiedInPillow = inspection.modifiedFiles.filter((f) =>
    f.startsWith("pillow/"),
  );

  if (auditText) {
    for (const pattern of DUPLICATE_PATTERNS) {
      if (pattern.test(auditText)) {
        findings.push(`Audit mentions architecture concern: ${pattern.source}`);
        score -= 25;
      }
    }
    if (/component reuse|reuse existing|extends existing/i.test(auditText)) {
      score = Math.min(100, score + 5);
    }
  }

  if (
    mission.progress.some((p) => p.kind === "file_created") &&
    createdInPillow.length === 0 &&
    inspection.gitDiffAvailable
  ) {
    findings.push("Progress reports file creation but git shows no new pillow files");
    score -= 15;
  }

  const result: CriterionResult =
    score >= 90 ? "passed" : score >= 60 ? "partially_passed" : "failed";

  return {
    category: "architecture_compliance",
    result,
    score: Math.max(0, score),
    findings,
  };
}

export function verifyComponentReuse(
  auditText?: string | null,
): CategoryReviewResult {
  const findings: string[] = [];
  let result: CriterionResult = "unable_to_verify";

  if (auditText) {
    if (/reuse|existing module|extends|delegates to/i.test(auditText)) {
      result = "passed";
    } else if (/new module|from scratch/i.test(auditText)) {
      result = "partially_passed";
      findings.push("Audit suggests greenfield implementation — verify reuse");
    } else {
      result = "partially_passed";
      findings.push("Component reuse not explicitly documented in audit");
    }
  }

  return {
    category: "component_reuse",
    result,
    score: result === "passed" ? 100 : result === "partially_passed" ? 65 : 0,
    findings,
  };
}

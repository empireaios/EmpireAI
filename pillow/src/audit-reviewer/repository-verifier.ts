import type { RepositoryInspection } from "../recovery/types.js";
import type { CategoryReviewResult, CriterionResult } from "./types.js";

const AUDIT_STANDARD_SECTIONS = [
  "Summary",
  "Owner Justification",
  "Validation",
  "Executive Recommendation",
  "Future Enhancements",
];

const GOVERNANCE_FORBIDDEN_WRITES = [
  /^JOURNEY\.md$/i,
  /^EMPIREAI_DECISIONS\.md$/i,
  /^PILLOW_ARCHITECTURE_CONTRACT\.md$/i,
];

export function verifyRepositoryContinuity(
  inspection: RepositoryInspection,
  auditText?: string | null,
): CategoryReviewResult {
  const findings: string[] = [];

  if (!inspection.repositoryIntegrityOk) {
    findings.push("Repository merge conflict detected");
  }

  if (auditText) {
    if (
      !/repository continuity|read-only|unchanged|preservation/i.test(auditText)
    ) {
      findings.push("Repository continuity not documented in Executive Audit");
    }
  }

  const result: CriterionResult =
    findings.length === 0
      ? "passed"
      : findings.some((f) => f.includes("merge conflict"))
        ? "failed"
        : "partially_passed";

  return {
    category: "repository_continuity",
    result,
    score: findings.length === 0 ? 100 : 50,
    findings,
  };
}

export function verifyRepositoryOwnership(
  inspection: RepositoryInspection,
): CategoryReviewResult {
  const findings: string[] = [];
  const allFiles = [...inspection.modifiedFiles, ...inspection.createdFiles];

  for (const file of allFiles) {
    for (const forbidden of GOVERNANCE_FORBIDDEN_WRITES) {
      if (forbidden.test(file)) {
        findings.push(
          `Governance file touched by engineering mission: ${file} — requires Approval Gate`,
        );
      }
    }
  }

  return {
    category: "repository_ownership",
    result: findings.length === 0 ? "passed" : "failed",
    score: findings.length === 0 ? 100 : 0,
    findings,
  };
}

export function verifyGovernanceCompliance(
  auditText?: string | null,
): CategoryReviewResult {
  const findings: string[] = [];
  if (!auditText) {
    return {
      category: "governance_compliance",
      result: "failed",
      score: 0,
      findings: ["Executive Audit text required for governance verification"],
    };
  }

  for (const section of AUDIT_STANDARD_SECTIONS) {
    if (!auditText.includes(section)) {
      if (section === "Summary" && /executive audit/i.test(auditText)) continue;
      findings.push(`Missing standard section: ${section}`);
    }
  }

  if (!/owner justification/i.test(auditText)) {
    findings.push("Owner Justification missing — mandatory per Executive Audit Standard");
  }

  const criticalMissing = findings.filter(
    (f) => f.includes("Owner Justification") || f.includes("Executive Recommendation"),
  );

  const result: CriterionResult =
    criticalMissing.length > 0
      ? "failed"
      : findings.length === 0
        ? "passed"
        : "partially_passed";

  return {
    category: "governance_compliance",
    result,
    score: Math.max(0, 100 - findings.length * 12),
    findings,
  };
}

export function verifyEngineeringCompleteness(
  auditText?: string | null,
  hasValidation?: boolean,
): CategoryReviewResult {
  const findings: string[] = [];

  if (!auditText || !/executive audit/i.test(auditText)) {
    findings.push("Executive Audit document not identified");
  }
  if (!hasValidation && auditText && !/validation|typecheck|build|pass/i.test(auditText)) {
    findings.push("Validation results not documented");
  }
  if (auditText && !/executive recommendation/i.test(auditText)) {
    findings.push("Executive recommendation section missing");
  }

  const result: CriterionResult =
    findings.length === 0 ? "passed" : findings.length <= 1 ? "partially_passed" : "failed";

  return {
    category: "engineering_completeness",
    result,
    score: Math.max(0, 100 - findings.length * 20),
    findings,
  };
}

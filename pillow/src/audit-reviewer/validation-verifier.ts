import type { ValidationCycleResult } from "../recovery/types.js";
import type { SupervisedMission } from "../supervisor/types.js";
import type { CategoryReviewResult, CriterionResult } from "./types.js";

export function verifyValidationQuality(
  mission: SupervisedMission,
  auditText?: string | null,
  validation?: ValidationCycleResult | null,
  typecheckPassed?: boolean,
  buildPassed?: boolean,
): CategoryReviewResult {
  const findings: string[] = [];
  let passed = 0;
  let total = 0;

  const record = (ok: boolean, msg: string) => {
    total++;
    if (ok) passed++;
    else findings.push(msg);
  };

  const tc =
    typecheckPassed ??
    validation?.typecheckPassed ??
    mission.validationCompleted;
  const build =
    buildPassed ?? validation?.buildPassed ?? mission.validationCompleted;

  record(Boolean(tc), "Typecheck not passed or not recorded");
  record(Boolean(build), "Build not passed or not recorded");
  record(
    mission.validationCompleted ||
      mission.progress.some((p) => p.kind === "validation_executed") ||
      Boolean(validation?.executed) ||
      Boolean(auditText && /validation|typecheck|pass/i.test(auditText)),
    "Validation execution not recorded on mission",
  );

  if (auditText && !/typecheck|build|validation results/i.test(auditText)) {
    findings.push("Validation results not documented in Executive Audit");
  }

  const result: CriterionResult =
    passed === total && findings.length === 0
      ? "passed"
      : passed === 0
        ? "failed"
        : "partially_passed";

  return {
    category: "validation_quality",
    result,
    score: total > 0 ? Math.round((passed / total) * 100) : 0,
    findings,
  };
}

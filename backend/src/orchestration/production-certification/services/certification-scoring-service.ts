/**
 * G6-00 — Certification scoring service.
 */

import type {
  CertificationCheckResult,
  CertificationResultState,
} from "../contracts/production-certification-types.js";

const STATUS_SCORES: Record<CertificationResultState, number> = {
  pass: 100,
  pass_with_conditions: 85,
  warning: 70,
  blocked: 0,
  fail: 0,
  not_applicable: 100,
  not_tested: 50,
  unknown: 25,
};

export function scoreCertificationStatus(status: CertificationResultState): number {
  return STATUS_SCORES[status];
}

export function aggregateCertificationScore(checks: CertificationCheckResult[]): number {
  if (checks.length === 0) return 0;
  const applicable = checks.filter((check) => check.status !== "not_applicable");
  if (applicable.length === 0) return 100;
  const total = applicable.reduce((sum, check) => sum + check.score, 0);
  return Math.round(total / applicable.length);
}

export function deriveOverallCertificationStatus(
  checks: CertificationCheckResult[],
): CertificationResultState {
  if (checks.some((check) => check.status === "blocked")) return "blocked";
  if (checks.some((check) => check.status === "fail" && check.severity === "critical")) {
    return "fail";
  }
  if (checks.some((check) => check.status === "fail")) return "fail";
  if (checks.some((check) => check.status === "warning")) return "warning";
  if (checks.some((check) => check.status === "pass_with_conditions")) {
    return "pass_with_conditions";
  }
  if (checks.every((check) => check.status === "not_applicable")) return "not_applicable";
  if (checks.some((check) => check.status === "not_tested" || check.status === "unknown")) {
    return "pass_with_conditions";
  }
  return "pass";
}

export function isProductionEligibleFromChecks(
  checks: CertificationCheckResult[],
  requiredGateCheckIds: string[],
): boolean {
  const requiredChecks = checks.filter((check) => requiredGateCheckIds.includes(check.checkId));
  if (requiredChecks.length === 0) return false;
  return requiredChecks.every(
    (check) =>
      check.status === "pass" ||
      check.status === "pass_with_conditions" ||
      check.status === "not_applicable",
  );
}

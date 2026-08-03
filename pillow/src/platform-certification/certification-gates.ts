import type { CertificationStatus, CheckResult, EndToEndScenarioResult, MissionVerificationRow } from "./types.js";
export function evaluateCertificationGates(matrix: MissionVerificationRow[], negative: CheckResult[], e2e: EndToEndScenarioResult[]): CertificationStatus {
  if (matrix.some((row) => row.status === "Failed")) return "Failed";
  if (matrix.some((row) => row.status === "Missing")) return "Missing";
  if (matrix.some((row) => row.status !== "Certified")) return "Partially_Implemented";
  return negative.every((check) => check.passed) && e2e.filter((step) => step.critical).every((step) => step.passed) ? "Certified" : "Conditionally_Certified";
}

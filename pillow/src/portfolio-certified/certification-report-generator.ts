/** X2-21 — Certification Report Generator. */

import type {
  ModuleCertificationResult,
  ModulePassStatus,
  PortfolioCertificationReport,
} from "./types.js";

export class CertificationReportGenerator {
  deriveOverall(
    results: ModuleCertificationResult[],
    crossModule: ModulePassStatus,
    endToEnd: ModulePassStatus,
    governance: ModulePassStatus,
    passThresholdPercent: number,
  ): PortfolioCertificationReport["overallCertificationStatus"] {
    const scored = results.filter((r) => r.status !== "skip");
    if (scored.length === 0) return "pending";
    const passed = scored.filter((r) => r.status === "pass").length;
    const percent = Math.round((passed / scored.length) * 100);
    const extrasOk =
      crossModule !== "fail" &&
      endToEnd !== "fail" &&
      governance !== "fail" &&
      crossModule !== "unavailable" &&
      endToEnd !== "unavailable" &&
      governance !== "unavailable";
    if (percent >= passThresholdPercent && extrasOk) {
      return "certified";
    }
    if (passed === 0) return "failed";
    return "partial";
  }

  readinessScore(
    results: ModuleCertificationResult[],
    crossModule: ModulePassStatus,
    endToEnd: ModulePassStatus,
    governance: ModulePassStatus,
  ): number {
    const scored = results.filter((r) => r.status !== "skip");
    const modulePercent =
      scored.length === 0
        ? 0
        : Math.round(
            (scored.filter((r) => r.status === "pass").length / scored.length) * 70,
          );
    const extras =
      (crossModule === "pass" ? 10 : 0) +
      (endToEnd === "pass" ? 10 : 0) +
      (governance === "pass" ? 10 : 0);
    return Math.max(0, Math.min(100, modulePercent + extras));
  }

  collectWarnings(results: ModuleCertificationResult[]): string[] {
    return results
      .filter((r) => r.status === "unavailable" || r.status === "skip")
      .map((r) => `${r.moduleId}: ${r.notes}`);
  }

  collectErrors(results: ModuleCertificationResult[]): string[] {
    return results
      .filter((r) => r.status === "fail")
      .map((r) => `${r.moduleId}: ${r.notes}`);
  }

  evidenceBundle(
    results: ModuleCertificationResult[],
    extras: string[],
  ): string {
    return [...results.map((r) => r.evidenceReference), ...extras].join(" | ");
  }
}

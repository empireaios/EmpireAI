/** X2-10 — Certification Report Generator. */

import type {
  ModuleCertificationResult,
  ModulePassStatus,
  PortfolioIntelligenceCertificationReport,
} from "./types.js";

export class CertificationReportGenerator {
  summarizeModules(results: ModuleCertificationResult[]): string {
    return results
      .filter((r) => r.status === "pass")
      .map((r) => r.moduleId)
      .join(",");
  }

  deriveOverall(
    results: ModuleCertificationResult[],
    endToEnd: ModulePassStatus,
    passThresholdPercent: number,
  ): PortfolioIntelligenceCertificationReport["overallCertificationStatus"] {
    const scored = results.filter((r) => r.status !== "skip");
    if (scored.length === 0) return "pending";
    const passed = scored.filter((r) => r.status === "pass").length;
    const percent = Math.round((passed / scored.length) * 100);
    if (percent >= passThresholdPercent && endToEnd === "pass") return "certified";
    if (passed === 0) return "failed";
    return "partial";
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

  evidenceBundle(results: ModuleCertificationResult[], e2eEvidence: string): string {
    return [...results.map((r) => r.evidenceReference), e2eEvidence].join(" | ");
  }

  statusOf(
    results: ModuleCertificationResult[],
    moduleId: ModuleCertificationResult["moduleId"],
  ): ModulePassStatus {
    return results.find((r) => r.moduleId === moduleId)?.status ?? "unavailable";
  }
}

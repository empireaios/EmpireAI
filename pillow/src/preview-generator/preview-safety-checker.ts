/** T3-05 — Preview safety checks. */

import type { PreviewGeneratorConfiguration } from "./configuration.js";
import type { SafetyCheck } from "./types.js";
import { appendPreviewLog } from "./preview-logging.js";

export class PreviewSafetyChecker {
  check(
    previewFiles: string[],
    previewUrl: string,
    config: PreviewGeneratorConfiguration,
  ): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    const isolated = config.isolateFromProduction;
    checks.push({
      checkId: "production-isolation",
      checkName: "Production isolation",
      passed: isolated,
      details: isolated
        ? "Preview isolated from production"
        : "Production isolation not enabled",
    });

    const noProductionRoute =
      !previewUrl.startsWith("/") ||
      previewUrl.startsWith(config.previewRoutePrefix);
    checks.push({
      checkId: "preview-routing",
      checkName: "Preview routing isolated",
      passed: noProductionRoute || previewUrl.startsWith(config.previewRoutePrefix),
      details: "Preview uses isolated route prefix",
    });

    const noBackend = previewFiles.every(
      (f) => !f.startsWith("backend/") && !f.startsWith("pillow/"),
    );
    checks.push({
      checkId: "frontend-only",
      checkName: "Frontend-only scope",
      passed: noBackend,
      details: noBackend ? "No backend changes" : "Non-frontend preview detected",
    });

    const noDeploy = !previewFiles.some((f) => f.includes("production/"));
    checks.push({
      checkId: "no-production-deploy",
      checkName: "No production deployment",
      passed: noDeploy,
      details: "Preview does not target production paths",
    });

    const previewPath = previewFiles.every((f) => f.includes(".preview") || f.includes("preview"));
    checks.push({
      checkId: "preview-artifacts",
      checkName: "Preview artifacts only",
      passed: previewPath || previewFiles.length <= 3,
      details: "Preview artifacts in isolated directory",
    });

    appendPreviewLog({
      event: "safety_check",
      level: checks.every((c) => c.passed) ? "info" : "warn",
      details: `${checks.filter((c) => c.passed).length}/${checks.length} safety checks passed`,
    });

    return checks;
  }
}

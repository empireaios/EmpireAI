/** T3-04 — Theme builder safety checks. */

import type { ThemeBuilderConfiguration } from "./configuration.js";
import type { SafetyCheck } from "./types.js";
import { appendThemeLog } from "./theme-logging.js";

export class ThemeSafetyChecker {
  check(
    targetFiles: string[],
    themeCode: string,
    config: ThemeBuilderConfiguration,
  ): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    const allowedScope = targetFiles.every((f) =>
      config.allowedTargetDirectories.some((dir) => f.startsWith(dir)),
    );
    checks.push({
      checkId: "allowed-directories",
      checkName: "Allowed target directories",
      passed: allowedScope,
      details: allowedScope ? "Theme targets within approved scope" : "Target outside allowed directories",
    });

    const protectedHit = targetFiles.some((f) =>
      config.protectedFiles.some((p) => f === p || f.startsWith(p)),
    );
    checks.push({
      checkId: "protected-files",
      checkName: "Protected files preserved",
      passed: !protectedHit,
      details: protectedHit ? "Protected file targeted" : "No protected files targeted",
    });

    const noBackend = targetFiles.every(
      (f) => !f.startsWith("backend/") && !f.startsWith("pillow/"),
    );
    checks.push({
      checkId: "frontend-only",
      checkName: "Frontend-only scope",
      passed: noBackend,
      details: noBackend ? "No backend changes" : "Non-frontend target detected",
    });

    const noDelete = !themeCode.includes("unlinkSync") && !themeCode.includes("rmSync");
    checks.push({
      checkId: "no-destructive",
      checkName: "No destructive operations",
      passed: noDelete,
      details: "No file deletion in generated theme",
    });

    const preservesTokens = !themeCode.includes("!important") || themeCode.includes("var(--");
    checks.push({
      checkId: "preserve-tokens",
      checkName: "Design system tokens preserved",
      passed: preservesTokens,
      details: "Theme uses CSS custom properties",
    });

    appendThemeLog({
      event: "safety_check",
      level: checks.every((c) => c.passed) ? "info" : "warn",
      details: `${checks.filter((c) => c.passed).length}/${checks.length} safety checks passed`,
    });

    return checks;
  }
}

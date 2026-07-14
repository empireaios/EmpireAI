/** T3-03 — Layout refactoring safety checks. */

import type { LayoutRefactoringConfiguration } from "./configuration.js";
import type { SafetyCheck } from "./types.js";
import { appendRefactoringLog } from "./refactoring-logging.js";

export class LayoutSafetyChecker {
  check(
    targetFiles: string[],
    layoutCode: string,
    config: LayoutRefactoringConfiguration,
  ): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    const allowedScope = targetFiles.every((f) =>
      config.allowedTargetDirectories.some((dir) => f.startsWith(dir)),
    );
    checks.push({
      checkId: "allowed-directories",
      checkName: "Allowed target directories",
      passed: allowedScope,
      details: allowedScope
        ? "Layout targets within approved scope"
        : "Target outside allowed directories",
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

    const noDelete = !layoutCode.includes("unlinkSync") && !layoutCode.includes("rmSync");
    checks.push({
      checkId: "no-destructive",
      checkName: "No destructive operations",
      passed: noDelete,
      details: "No file deletion in generated code",
    });

    const preservesRouting = config.preserveRouting
      ? !layoutCode.includes("redirect(")
      : true;
    checks.push({
      checkId: "preserve-routing",
      checkName: "Routing preserved",
      passed: preservesRouting,
      details: config.preserveRouting
        ? "No routing changes in generated layout"
        : "Routing preservation not required",
    });

    const preservesLogic =
      !layoutCode.includes("useEffect(() => { fetch(") &&
      !layoutCode.includes("delete ");
    checks.push({
      checkId: "preserve-business-logic",
      checkName: "Business logic preserved",
      passed: preservesLogic,
      details: "No data flow or logic mutations in layout code",
    });

    const hasUseClient =
      layoutCode.includes('"use client"') || layoutCode.includes("'use client'");
    checks.push({
      checkId: "client-component",
      checkName: "Client component directive",
      passed: hasUseClient,
      details: hasUseClient ? "use client directive present" : "Missing use client",
    });

    appendRefactoringLog({
      event: "safety_check",
      level: checks.every((c) => c.passed) ? "info" : "warn",
      details: `${checks.filter((c) => c.passed).length}/${checks.length} safety checks passed`,
    });

    return checks;
  }
}

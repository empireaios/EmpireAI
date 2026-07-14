/** T3-02 — Component safety checks. */

import type { ComponentGeneratorConfiguration } from "./configuration.js";
import type { SafetyCheck } from "./types.js";
import { appendGenerationLog } from "./generation-logging.js";

export class ComponentSafetyChecker {
  check(
    targetFiles: string[],
    componentCode: string,
    config: ComponentGeneratorConfiguration,
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
        ? "Component targets within approved scope"
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

    const noDelete = !componentCode.includes("unlinkSync") && !componentCode.includes("rmSync");
    checks.push({
      checkId: "no-destructive",
      checkName: "No destructive operations",
      passed: noDelete,
      details: "No file deletion in generated code",
    });

    const hasUseClient = componentCode.includes('"use client"') || componentCode.includes("'use client'");
    checks.push({
      checkId: "client-component",
      checkName: "Client component directive",
      passed: hasUseClient,
      details: hasUseClient ? "use client directive present" : "Missing use client",
    });

    appendGenerationLog({
      event: "safety_check",
      level: checks.every((c) => c.passed) ? "info" : "warn",
      details: `${checks.filter((c) => c.passed).length}/${checks.length} safety checks passed`,
    });

    return checks;
  }
}

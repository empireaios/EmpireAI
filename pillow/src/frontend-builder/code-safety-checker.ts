/** T3-01 — Code safety checks before build output. */

import type { FrontendBuilderConfiguration } from "./configuration.js";
import type { ProposedCodeChange, SafetyCheck } from "./types.js";
import { appendBuildLog } from "./build-logging.js";

export class CodeSafetyChecker {
  check(
    changes: ProposedCodeChange[],
    config: FrontendBuilderConfiguration,
  ): SafetyCheck[] {
    const checks: SafetyCheck[] = [];

    const allowedScope = changes.every((c) =>
      config.allowedTargetDirectories.some((dir) => c.targetFile.startsWith(dir)),
    );
    checks.push({
      checkId: "allowed-directories",
      checkName: "Allowed target directories",
      passed: allowedScope,
      details: allowedScope
        ? "All target files within approved frontend scope"
        : "One or more target files outside allowed directories",
    });

    const protectedHit = changes.some((c) =>
      config.protectedFiles.some(
        (p) => c.targetFile === p || c.targetFile.startsWith(p),
      ),
    );
    checks.push({
      checkId: "protected-files",
      checkName: "Protected files preserved",
      passed: !protectedHit,
      details: protectedHit
        ? "Attempted change to protected file"
        : "No protected files targeted",
    });

    const noDelete = changes.every((c) => c.changeType !== ("delete" as never));
    checks.push({
      checkId: "no-destructive",
      checkName: "No destructive changes",
      passed: noDelete,
      details: "Only modify/create changes permitted",
    });

    const preservesArch = changes.every((c) => c.preservesArchitecture);
    checks.push({
      checkId: "architecture-preserved",
      checkName: "Architecture preserved",
      passed: preservesArch,
      details: preservesArch
        ? "Changes marked as architecture-preserving"
        : "Architecture preservation not confirmed",
    });

    const backendSafe = changes.every(
      (c) => !c.targetFile.startsWith("backend/") && !c.targetFile.startsWith("pillow/"),
    );
    checks.push({
      checkId: "frontend-only",
      checkName: "Frontend-only scope",
      passed: backendSafe,
      details: backendSafe
        ? "No backend or unrelated system changes"
        : "Non-frontend target detected",
    });

    appendBuildLog({
      event: "safety_check",
      level: checks.every((c) => c.passed) ? "info" : "warn",
      details: `${checks.filter((c) => c.passed).length}/${checks.length} safety checks passed`,
    });

    return checks;
  }
}

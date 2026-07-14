/** T3-08 — Layout version restoration. */

import type { LayoutRefactoringReport } from "../layout-refactoring/types.js";
import type { RestorePoint } from "./types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class LayoutVersionRestorer {
  restore(
    restorePoint: RestorePoint,
    layoutRefactoring: LayoutRefactoringReport | null,
    config: RollbackManagerConfiguration,
  ): string[] {
    if (!config.allowedRollbackScopes.includes("layout") && !config.allowedRollbackScopes.includes("full")) {
      return [];
    }

    appendRollbackLog({
      event: "rollback_execution",
      level: "info",
      details: `Restoring layout versions from ${restorePoint.restorePointId}`,
    });

    const restored: string[] = [];
    for (const ref of restorePoint.layoutVersionReferences) {
      const record = layoutRefactoring?.records.find((r) => r.layoutRefactoringId === ref);
      restored.push(record?.layoutRefactoringId ?? ref);
    }
    return restored;
  }
}

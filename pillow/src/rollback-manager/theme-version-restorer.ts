/** T3-08 — Theme version restoration. */

import type { ThemeGenerationReport } from "../theme-builder/types.js";
import type { RestorePoint } from "./types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class ThemeVersionRestorer {
  restore(
    restorePoint: RestorePoint,
    themeGeneration: ThemeGenerationReport | null,
    config: RollbackManagerConfiguration,
  ): string[] {
    if (!config.allowedRollbackScopes.includes("theme") && !config.allowedRollbackScopes.includes("full")) {
      return [];
    }

    appendRollbackLog({
      event: "rollback_execution",
      level: "info",
      details: `Restoring theme versions from ${restorePoint.restorePointId}`,
    });

    const restored: string[] = [];
    for (const ref of restorePoint.themeVersionReferences) {
      const record = themeGeneration?.records.find((r) => r.themeId === ref);
      restored.push(record?.themeId ?? ref);
    }
    return restored;
  }
}

/** T3-08 — Component version restoration. */

import type { ComponentGenerationReport } from "../component-generator/types.js";
import type { RestorePoint } from "./types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class ComponentVersionRestorer {
  restore(
    restorePoint: RestorePoint,
    componentGeneration: ComponentGenerationReport | null,
    config: RollbackManagerConfiguration,
  ): string[] {
    if (!config.allowedRollbackScopes.includes("component") && !config.allowedRollbackScopes.includes("full")) {
      return [];
    }

    appendRollbackLog({
      event: "rollback_execution",
      level: "info",
      details: `Restoring component versions from ${restorePoint.restorePointId}`,
    });

    const restored: string[] = [];
    const records =
      componentGeneration?.records.filter((r) =>
        restorePoint.componentVersionReferences.includes(r.componentGenerationId),
      ) ?? [];

    for (const ref of restorePoint.componentVersionReferences) {
      const record = records.find((r) => r.componentGenerationId === ref);
      if (record) {
        restored.push(record.componentGenerationId);
      } else {
        restored.push(ref);
      }
    }

    return restored;
  }
}

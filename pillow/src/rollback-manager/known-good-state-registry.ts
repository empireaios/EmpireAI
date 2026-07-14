/** T3-08 — Known-good state registry. */

import type { RegressionRunReport } from "../regression-protection/types.js";
import type { ValidationRunReport } from "../validation-engine/types.js";
import type { RollbackManagerConfiguration } from "./configuration.js";
import type { RestorePoint } from "./types.js";
import { RollbackMetadataGenerator } from "./rollback-metadata-generator.js";
import { appendRollbackLog } from "./rollback-logging.js";

export class KnownGoodStateRegistry {
  private readonly knownGoodStates = new Map<string, RestorePoint>();
  private readonly metadata = new RollbackMetadataGenerator();

  register(point: RestorePoint): string {
    const stateId = this.metadata.buildKnownGoodStateId();
    this.knownGoodStates.set(stateId, point);
    appendRollbackLog({
      event: "known_good_state_registered",
      level: "info",
      details: `Registered ${stateId} from restore point ${point.restorePointId}`,
    });
    return stateId;
  }

  selectFromReports(input: {
    regressionReport: RegressionRunReport | null;
    validationReport: ValidationRunReport | null;
    restorePoints: RestorePoint[];
    config: RollbackManagerConfiguration;
  }): { stateId: string; restorePoint: RestorePoint } | null {
    appendRollbackLog({
      event: "restore_point_selection",
      level: "info",
      details: "Selecting known-good rollback point",
    });

    const active = input.restorePoints.filter((p) => p.restorePointStatus === "active");
    if (active.length === 0) return null;

    const regressionPass =
      input.regressionReport?.validation.decision === "pass" ||
      input.regressionReport?.validation.decision === "partial";
    const validationPass =
      input.validationReport?.validation.decision === "pass" ||
      input.validationReport?.validation.decision === "partial";

    let selected = active[active.length - 1];
    if (!selected) return null;
    if (regressionPass && validationPass && active.length > 1) {
      selected = active[active.length - 2] ?? selected;
    }

    for (const [stateId, point] of this.knownGoodStates) {
      if (point.restorePointId === selected.restorePointId) {
        return { stateId, restorePoint: point };
      }
    }

    const stateId = this.register(selected);
    return { stateId, restorePoint: selected };
  }

  getState(stateId: string): RestorePoint | null {
    return this.knownGoodStates.get(stateId) ?? null;
  }

  resetForTesting(): void {
    this.knownGoodStates.clear();
  }
}

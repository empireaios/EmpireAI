import { CERTIFIED_MODULE_IDS, MODULE_MISSIONS } from "./paths.js";
import type { EmpireCertifiedDependencies } from "./dependencies.js";
import type { ModuleCertificationResult } from "./types.js";

export class ProgrammeValidationCoordinator {
  validateEmpireModules(dependencies: EmpireCertifiedDependencies): ModuleCertificationResult[] {
    return CERTIFIED_MODULE_IDS.map((moduleId) => {
      const dependency = dependencies[moduleId];
      if (!dependency) {
        return {
          moduleId,
          missionId: MODULE_MISSIONS[moduleId],
          status: "unavailable",
          evidenceReference: `structural://missing/${moduleId}`,
          notes: "Module not connected",
        };
      }
      try {
        const probe = dependency.getState ?? dependency.validateForSupervisorSync ?? dependency.getEngineRecord;
        if (!probe) {
          return {
            moduleId,
            missionId: MODULE_MISSIONS[moduleId],
            status: "fail",
            evidenceReference: `structural://unsupported/${moduleId}`,
            notes: "No supported structural readiness probe exported",
          };
        }
        probe.call(dependency);
        return {
          moduleId,
          missionId: MODULE_MISSIONS[moduleId],
          status: "pass",
          evidenceReference: `structural://${moduleId}/ready`,
          notes: "Read-only structural probe passed",
        };
      } catch {
        return {
          moduleId,
          missionId: MODULE_MISSIONS[moduleId],
          status: "fail",
          evidenceReference: `structural://${moduleId}/failed`,
          notes: "Structural readiness probe failed",
        };
      }
    });
  }
}

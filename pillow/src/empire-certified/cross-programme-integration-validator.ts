import {
  CERTIFIED_PROGRAMME_IDS,
  PROGRAMME_ANCHORS,
  PROGRAMME_LABELS,
} from "./paths.js";
import type { EmpireCertifiedDependencies, StructuralEmpireModule } from "./dependencies.js";
import type { ModuleCertificationResult, ModulePassStatus, ProgrammeCertificationResult } from "./types.js";

function probe(dependency: StructuralEmpireModule | null | undefined): ModulePassStatus {
  if (!dependency) return "unavailable";
  try {
    const fn = dependency.getState ?? dependency.validateForSupervisorSync ?? dependency.getEngineRecord;
    if (!fn) return "fail";
    fn.call(dependency);
    return "pass";
  } catch {
    return "fail";
  }
}

/** Coordinates X1–X5 programme-level structural validation. */
export class CrossProgrammeIntegrationValidator {
  validateProgrammes(
    dependencies: EmpireCertifiedDependencies,
    empireModuleResults: ModuleCertificationResult[],
  ): ProgrammeCertificationResult[] {
    return CERTIFIED_PROGRAMME_IDS.map((programmeId) => {
      if (programmeId === "X5") {
        const allPass = empireModuleResults.every((r) => r.status === "pass");
        const anyPass = empireModuleResults.some((r) => r.status === "pass");
        const status: ModulePassStatus = allPass ? "pass" : anyPass ? "fail" : "unavailable";
        return {
          programmeId,
          programmeLabel: PROGRAMME_LABELS[programmeId],
          status,
          evidenceReference: `programme://X5/empire-intelligence/${status}`,
          notes: allPass
            ? "All Empire Intelligence modules passed structural validation"
            : "One or more Empire Intelligence modules failed structural validation",
        };
      }
      const anchorId = PROGRAMME_ANCHORS[programmeId];
      const status = probe(dependencies[anchorId]);
      return {
        programmeId,
        programmeLabel: PROGRAMME_LABELS[programmeId],
        status,
        evidenceReference: `programme://${programmeId}/${anchorId}/${status}`,
        notes:
          status === "pass"
            ? `${PROGRAMME_LABELS[programmeId]} programme anchor passed structural probe`
            : `${PROGRAMME_LABELS[programmeId]} programme anchor unavailable or failed`,
      };
    });
  }

  validateIntegration(programmeResults: ProgrammeCertificationResult[]): ModulePassStatus {
    if (programmeResults.every((r) => r.status === "pass")) return "pass";
    if (programmeResults.some((r) => r.status === "pass")) return "fail";
    return "unavailable";
  }
}

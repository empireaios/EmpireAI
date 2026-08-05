import { MSR_METADATA_VERSION } from "./paths.js";
import type { MsrInput, MsrValidationReport } from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q10-0[4-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

export class MissionValidator {
  decide(input: MsrInput): MsrValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.forceFail === true && input.fabricateState === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: MsrInput, started: number): MsrValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Mission Runtime requires validated=true");
    if (input.fabricateState === true) errors.push("fabricated mission state is rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk mission execution requires grandKingApproved=true");
    }

    return this.finalize(
      errors.length || decision === "fail"
        ? "fail"
        : decision === "pass" && warnings.length
          ? "partial"
          : decision,
      errors,
      warnings,
      started,
    );
  }

  validateExecute(input: MsrInput, started: number): MsrValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    if (input.highRisk === true && input.grandKingApproved !== true) {
      return this.finalize(
        "fail",
        [...base.errors, "High-risk mission execution requires grandKingApproved=true"],
        base.warnings,
        started,
      );
    }
    return base;
  }

  hasBoundaryViolation(input: MsrInput): boolean {
    return (
      input.replaceWorkerLogic === true ||
      input.replaceOrchestrationLogic === true ||
      input.executeUnauthorisedMissions === true ||
      input.fabricateState === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1004OrLater === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.highRisk === true && input.grandKingApproved !== true && input.validated !== false)
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Mission Runtime stops at Q10-03`);
    }
  }

  private pushBoundaryErrors(input: MsrInput, errors: string[]) {
    if (input.replaceWorkerLogic) errors.push("Mission Runtime must never replace worker logic");
    if (input.replaceOrchestrationLogic) {
      errors.push("Mission Runtime must never replace orchestration logic");
    }
    if (input.executeUnauthorisedMissions) {
      errors.push("Mission Runtime must never execute unauthorised missions");
    }
    if (input.fabricateState) errors.push("Mission Runtime must never fabricate mission state");
    if (input.bypassPillowGovernance) errors.push("Mission Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) errors.push("Mission Runtime must never bypass Grand King approval");
    if (input.overridePillow) errors.push("Mission Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Mission Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Mission Runtime must never override approved architecture");
    }
    if (input.implementQ1004OrLater) {
      errors.push("Mission Runtime must never implement Q10-04 or later");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    if (input.implementQ1004OrLater) {
      errors.push("Mission Runtime must never implement Q10-04 or later");
    }
  }

  private finalize(
    decision: MsrValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MsrValidationReport {
    return {
      validationReportId: `msr-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MSR_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID };

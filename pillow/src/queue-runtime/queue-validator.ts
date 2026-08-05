import { QRT_METADATA_VERSION } from "./paths.js";
import type { QrtInput, QrtValidationReport } from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q10-0[5-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

export class QueueValidator {
  decide(input: QrtInput): QrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.forceFail === true && input.fabricateState === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: QrtInput, started: number): QrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Queue Runtime requires validated=true");
    if (input.fabricateState === true) errors.push("fabricated queue state is rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk dispatch requires grandKingApproved=true");
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

  validateDispatch(input: QrtInput, started: number): QrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    if (input.highRisk === true && input.grandKingApproved !== true) {
      return this.finalize(
        "fail",
        [...base.errors, "High-risk dispatch requires grandKingApproved=true"],
        base.warnings,
        started,
      );
    }
    if (input.executeBusinessSpecificWork === true) {
      return this.finalize(
        "fail",
        [...base.errors, "Queue Runtime must never execute business-specific work"],
        base.warnings,
        started,
      );
    }
    return base;
  }

  hasBoundaryViolation(input: QrtInput): boolean {
    return (
      input.replaceWorkerLogic === true ||
      input.replaceMissionLogic === true ||
      input.executeBusinessSpecificWork === true ||
      input.fabricateState === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1005OrLater === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.highRisk === true && input.grandKingApproved !== true && input.validated !== false)
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Queue Runtime stops at Q10-04`);
    }
  }

  private pushBoundaryErrors(input: QrtInput, errors: string[]) {
    if (input.replaceWorkerLogic) errors.push("Queue Runtime must never replace worker logic");
    if (input.replaceMissionLogic) errors.push("Queue Runtime must never replace mission logic");
    if (input.executeBusinessSpecificWork) {
      errors.push("Queue Runtime must never execute business-specific work");
    }
    if (input.fabricateState) errors.push("Queue Runtime must never fabricate queue state");
    if (input.bypassPillowGovernance) errors.push("Queue Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) errors.push("Queue Runtime must never bypass Grand King approval");
    if (input.overridePillow) errors.push("Queue Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Queue Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Queue Runtime must never override approved architecture");
    }
    if (input.implementQ1005OrLater) {
      errors.push("Queue Runtime must never implement Q10-05 or later");
    }
    this.rejectMissionId(input.targetMissionId, errors);
  }

  private finalize(
    decision: QrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): QrtValidationReport {
    return {
      validationReportId: `qrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: QRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID };

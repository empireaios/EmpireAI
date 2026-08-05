import { POR_METADATA_VERSION } from "./paths.js";
import type { PorInput, PorValidationReport } from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q10-0[3-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

export class OrchestrationValidator {
  decide(input: PorInput): PorValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.forceFail === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: PorInput, started: number): PorValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Pillow Orchestration Runtime requires validated=true");
    if (input.forceFail === true) errors.push("forceFail is not permitted");
    if (input.fabricateSuccess === true) errors.push("fabricated execution success is rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk orchestration requires grandKingApproved=true");
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

  hasBoundaryViolation(input: PorInput): boolean {
    return (
      input.replaceWorkerLogic === true ||
      input.replaceToolLogic === true ||
      input.executeUnauthorisedActions === true ||
      input.fabricateSuccess === true ||
      input.bypassApprovalRuntime === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1003OrLater === true ||
      input.forceFail === true ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId)) ||
      (input.highRisk === true && input.grandKingApproved !== true)
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Pillow Orchestration Runtime stops at Q10-02`);
    }
  }

  private pushBoundaryErrors(input: PorInput, errors: string[]) {
    if (input.replaceWorkerLogic) errors.push("Pillow Orchestration Runtime must never replace worker implementations");
    if (input.replaceToolLogic) errors.push("Pillow Orchestration Runtime must never replace tool implementations");
    if (input.executeUnauthorisedActions) {
      errors.push("Pillow Orchestration Runtime must never execute unauthorised actions");
    }
    if (input.fabricateSuccess) errors.push("Pillow Orchestration Runtime must never fabricate execution results");
    if (input.bypassApprovalRuntime) errors.push("Pillow Orchestration Runtime must never bypass Approval Runtime");
    if (input.bypassPillowGovernance) errors.push("Pillow Orchestration Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) errors.push("Pillow Orchestration Runtime must never bypass Grand King approval");
    if (input.overridePillow) errors.push("Pillow Orchestration Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Pillow Orchestration Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Pillow Orchestration Runtime must never override approved architecture");
    }
    if (input.implementQ1003OrLater) {
      errors.push("Pillow Orchestration Runtime must never implement Q10-03 or later");
    }
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: PorValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): PorValidationReport {
    return {
      validationReportId: nextValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: POR_METADATA_VERSION,
    };
  }
}

function nextValidationId() {
  return `por-val-${Date.now()}`;
}

export { FORBIDDEN_MISSION_ID };

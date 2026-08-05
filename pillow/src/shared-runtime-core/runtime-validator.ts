import { SRTC_METADATA_VERSION } from "./paths.js";
import type { SrtcInput, SharedRuntimeCoreValidationReport } from "./types.js";

const FORBIDDEN_MISSION_ID = /^(Q10-0[2-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

export class SrtcValidator {
  decide(input: SrtcInput): SharedRuntimeCoreValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.forceFail === true) return "fail";
    return "pass";
  }

  validateInput(input: SrtcInput, started: number): SharedRuntimeCoreValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Shared Runtime Core requires validated=true");
    if (input.forceFail === true) errors.push("forceFail is not permitted");
    if (input.fabricated === true) errors.push("fabricated registrations are rejected");

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

  validateRegistrationFabricated(fabricated: boolean | undefined, label: string, errors: string[]) {
    if (fabricated === true) {
      errors.push(`${label} rejected: fabricated must be false`);
    }
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Shared Runtime Core stops at Q10-01`);
    }
  }

  hasBoundaryViolation(input: SrtcInput): boolean {
    return (
      input.replaceFactoryLogic === true ||
      input.replaceWorkerLogic === true ||
      input.executeBusinessSpecificDecisions === true ||
      input.fabricateRuntimeState === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1002OrLater === true ||
      input.fabricated === true ||
      input.forceFail === true ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  private pushBoundaryErrors(input: SrtcInput, errors: string[]) {
    if (input.replaceFactoryLogic) errors.push("Shared Runtime Core must never replace factory logic");
    if (input.replaceWorkerLogic) errors.push("Shared Runtime Core must never replace worker logic");
    if (input.executeBusinessSpecificDecisions) {
      errors.push("Shared Runtime Core must never execute business-specific decisions");
    }
    if (input.fabricateRuntimeState) errors.push("Shared Runtime Core must never fabricate runtime state");
    if (input.bypassGrandKingApproval) errors.push("Shared Runtime Core must never bypass Grand King approval");
    if (input.overridePillow) errors.push("Shared Runtime Core must never override Pillow");
    if (input.overrideGrandKing) errors.push("Shared Runtime Core must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Shared Runtime Core must never override approved architecture");
    }
    if (input.implementQ1002OrLater) {
      errors.push("Shared Runtime Core must never implement Q10-02 or later");
    }
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: SharedRuntimeCoreValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SharedRuntimeCoreValidationReport {
    return {
      validationReportId: `srtc-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SRTC_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID };

import { RECRT_METADATA_VERSION } from "./paths.js";
import type { RecrtInput, RecrtValidationReport } from "./types.js";

/** Q10-12 and later are out of scope for Recovery Runtime. */
const FORBIDDEN_MISSION_ID =
  /^(Q10-12|Q10-1[3-9]|Q10-[2-9]\d|Q10-\d{3,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const AUDIT_REF_PATTERN = /^audit:\/\/[A-Za-z0-9._\-/]+$/;
const STRUCTURAL_REF_PATTERN = /^(ckpt|state|audit|msg):\/\/[A-Za-z0-9._\-/]+$/;

export class RecoveryValidator {
  decide(input: RecrtInput): RecrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateSuccess === true) return "fail";
    if (input.loseState === true) return "fail";
    if (input.loseRecoverableExecutionState === true) return "fail";
    if (input.modifyBusinessData === true) return "fail";
    if (input.modifyValidatedBusinessData === true) return "fail";
    if (input.replaceBusinessLogic === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.businessPayload !== undefined) return "fail";
    return "pass";
  }

  validateInput(input: RecrtInput, started: number): RecrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Recovery Runtime requires validated=true");
    if (input.fabricateSuccess === true) {
      errors.push("fabricated recovery success is rejected");
    }
    if (input.loseState === true || input.loseRecoverableExecutionState === true) {
      errors.push("losing recoverable execution state is rejected");
    }
    if (input.modifyBusinessData === true || input.modifyValidatedBusinessData === true) {
      errors.push("modifying validated business data is rejected");
    }
    if (input.replaceBusinessLogic === true) {
      errors.push("replacing business logic is rejected");
    }
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.businessPayload !== undefined) {
      errors.push("business payload is rejected — structural state refs only");
    }
    if (input.auditReference && !AUDIT_REF_PATTERN.test(input.auditReference)) {
      errors.push("auditReference must be an audit://... reference — never raw secrets");
    }
    if (input.checkpointRef && !STRUCTURAL_REF_PATTERN.test(input.checkpointRef)) {
      errors.push("checkpointRef must be a structural ckpt:// or state:// reference");
    }
    if (input.stateRef && !STRUCTURAL_REF_PATTERN.test(input.stateRef)) {
      errors.push("stateRef must be a structural state:// or ckpt:// reference");
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

  validateDetect(input: RecrtInput, started: number): RecrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.failureId && !input.jobId) {
      errors.push("failureId or jobId required for detectFailure");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateRecoveryAction(
    input: RecrtInput,
    started: number,
    opts: { requireGrandKing?: boolean; highRisk?: boolean } = {},
  ): RecrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    const warnings = [...base.warnings];

    if (opts.requireGrandKing || opts.highRisk || input.highRisk) {
      if (!input.grandKingApproved) {
        errors.push(
          "Grand King approval required for highRisk / unrecoverable escalate paths",
        );
      }
    }

    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: RecrtInput): boolean {
    return (
      input.fabricateSuccess === true ||
      input.loseState === true ||
      input.loseRecoverableExecutionState === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.modifyBusinessData === true ||
      input.modifyValidatedBusinessData === true ||
      input.replaceBusinessLogic === true ||
      input.exposeSecrets === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1012OrLater === true ||
      input.businessPayload !== undefined ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Recovery Runtime stops at Q10-11`);
    }
  }

  private pushBoundaryErrors(input: RecrtInput, errors: string[]) {
    if (input.fabricateSuccess) {
      errors.push("Recovery Runtime must never fabricate recovery success");
    }
    if (input.loseState || input.loseRecoverableExecutionState) {
      errors.push("Recovery Runtime must never lose recoverable execution state");
    }
    if (input.bypassPillowGovernance) {
      errors.push("Recovery Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Recovery Runtime must never bypass Grand King approval");
    }
    if (input.modifyBusinessData || input.modifyValidatedBusinessData) {
      errors.push("Recovery Runtime must never modify validated business data");
    }
    if (input.replaceBusinessLogic) {
      errors.push("Recovery Runtime must never replace business logic");
    }
    if (input.exposeSecrets) errors.push("Recovery Runtime must never expose secrets");
    if (input.overridePillow) errors.push("Recovery Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Recovery Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Recovery Runtime must never override approved architecture");
    }
    if (input.implementQ1012OrLater) {
      errors.push("Recovery Runtime must never implement Q10-12 or later");
    }
    if (input.businessPayload !== undefined) {
      errors.push("Recovery Runtime must never accept business payloads");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: RecrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): RecrtValidationReport {
    return {
      validationReportId: `recrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: RECRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, AUDIT_REF_PATTERN, STRUCTURAL_REF_PATTERN };

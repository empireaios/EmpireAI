import { APVRT_METADATA_VERSION } from "./paths.js";
import type { ApvrtInput, ApvrtValidationReport } from "./types.js";

/** Q10-10 and later are out of scope for Approval Runtime. */
const FORBIDDEN_MISSION_ID = /^(Q10-10|Q10-1[1-9]|Q10-[2-9]\d|Q10-\d{3,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const AUDIT_REF_PATTERN = /^audit:\/\/[A-Za-z0-9._\-/]+$/;

export class ApprovalValidator {
  decide(input: ApvrtInput): ApvrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateDecision === true) return "fail";
    if (input.autoApproveRestricted === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    return "pass";
  }

  validateInput(input: ApvrtInput, started: number): ApvrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Approval Runtime requires validated=true");
    if (input.fabricateDecision === true) {
      errors.push("fabricated approval decisions are rejected");
    }
    if (input.autoApproveRestricted === true) {
      errors.push("auto-approve of restricted/grand_king actions is rejected");
    }
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.auditReference && !AUDIT_REF_PATTERN.test(input.auditReference)) {
      errors.push("auditReference must be an audit://... reference — never raw secrets");
    }
    if (input.approvalType === "grand_king" && input.grandKingApproved !== true) {
      // informational for submit path — grand_king type requires Grand King stage enforcement
      warnings.push("grand_king approval type requires Grand King stage completion");
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

  validateSubmit(input: ApvrtInput, started: number): ApvrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.missionId && !input.policyId) {
      errors.push("missionId or policyId required for submitApprovalRequest");
    }
    if (input.approvalType === "grand_king" && input.requiresGrandKing === false) {
      errors.push("grand_king approval type requires Grand King approval stage");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateDecide(input: ApvrtInput, started: number): ApvrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.approvalId) errors.push("approvalId required for decide");
    if (!input.decision) errors.push("decision required for decide");
    if (
      input.decision &&
      !["approve", "reject", "escalate", "delegate", "timeout"].includes(input.decision)
    ) {
      errors.push("decision must be approve|reject|escalate|delegate|timeout");
    }
    if (input.fabricateDecision === true) {
      errors.push("Approval Runtime must never fabricate decisions");
    }
    if (input.autoApproveRestricted === true) {
      errors.push("Approval Runtime must never auto-approve restricted actions");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: ApvrtInput): boolean {
    return (
      input.fabricateDecision === true ||
      input.autoApproveRestricted === true ||
      input.exposeSecrets === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1010OrLater === true ||
      input.replaceBusinessLogic === true ||
      input.replaceWorkerImplementations === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Approval Runtime stops at Q10-09`);
    }
  }

  private pushBoundaryErrors(input: ApvrtInput, errors: string[]) {
    if (input.fabricateDecision) {
      errors.push("Approval Runtime must never fabricate approval decisions");
    }
    if (input.autoApproveRestricted) {
      errors.push("Approval Runtime must never auto-approve restricted/grand_king actions");
    }
    if (input.exposeSecrets) errors.push("Approval Runtime must never expose secrets");
    if (input.bypassPillowGovernance) {
      errors.push("Approval Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Approval Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("Approval Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Approval Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Approval Runtime must never override approved architecture");
    }
    if (input.implementQ1010OrLater) {
      errors.push("Approval Runtime must never implement Q10-10 or later");
    }
    if (input.replaceBusinessLogic) {
      errors.push("Approval Runtime must never replace business logic");
    }
    if (input.replaceWorkerImplementations) {
      errors.push("Approval Runtime must never replace worker implementations");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: ApvrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ApvrtValidationReport {
    return {
      validationReportId: `apvrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: APVRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, AUDIT_REF_PATTERN };

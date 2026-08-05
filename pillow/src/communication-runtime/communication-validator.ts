import { COMRT_METADATA_VERSION } from "./paths.js";
import type { ComrtInput, ComrtValidationReport } from "./types.js";

/** Q10-09 and later are out of scope for Communication Runtime. */
const FORBIDDEN_MISSION_ID = /^(Q10-09|Q10-1\d|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const CONTEXT_REF_PATTERN = /^ctx:\/\/[A-Za-z0-9._\-/]+$/;

export class CommunicationValidator {
  decide(input: ComrtInput): ComrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateMessage === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: ComrtInput, started: number): ComrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Communication Runtime requires validated=true");
    if (input.fabricateMessage === true) errors.push("fabricated messages are rejected");
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk communication operations require grandKingApproved=true");
    }
    if (input.contextReference && !CONTEXT_REF_PATTERN.test(input.contextReference)) {
      errors.push("contextReference must be a ctx://... reference — never raw secrets or payloads");
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

  validateSend(input: ComrtInput, started: number): ComrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.sender) errors.push("sender required for sendMessage");
    if (!input.receiver) errors.push("receiver required for sendMessage");
    if (!input.messageType) errors.push("messageType required for sendMessage");
    if (!input.contextReference) {
      errors.push("contextReference required for sendMessage — never fabricate message content");
    } else if (!CONTEXT_REF_PATTERN.test(input.contextReference)) {
      errors.push("contextReference must be a ctx://... reference — never raw secrets or payloads");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateOpenChannel(input: ComrtInput, started: number): ComrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.channelType) errors.push("channelType required for openChannel");
    if (!input.participants || input.participants.length < 1) {
      errors.push("participants required for openChannel");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: ComrtInput): boolean {
    return (
      input.fabricateMessage === true ||
      input.exposeSecrets === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1009OrLater === true ||
      input.executeBusinessLogic === true ||
      input.replaceWorkerImplementations === true ||
      input.replaceOrchestrationLogic === true ||
      input.loseAcknowledgedMessages === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Communication Runtime stops at Q10-08`);
    }
  }

  private pushBoundaryErrors(input: ComrtInput, errors: string[]) {
    if (input.fabricateMessage) errors.push("Communication Runtime must never fabricate messages");
    if (input.exposeSecrets) errors.push("Communication Runtime must never expose secrets");
    if (input.bypassPillowGovernance) {
      errors.push("Communication Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Communication Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("Communication Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Communication Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Communication Runtime must never override approved architecture");
    }
    if (input.implementQ1009OrLater) {
      errors.push("Communication Runtime must never implement Q10-09 or later");
    }
    if (input.executeBusinessLogic) {
      errors.push("Communication Runtime must never execute business logic");
    }
    if (input.replaceWorkerImplementations) {
      errors.push("Communication Runtime must never replace worker implementations");
    }
    if (input.replaceOrchestrationLogic) {
      errors.push("Communication Runtime must never replace orchestration logic");
    }
    if (input.loseAcknowledgedMessages) {
      errors.push("Communication Runtime must never lose acknowledged messages");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: ComrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ComrtValidationReport {
    return {
      validationReportId: `comrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: COMRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, CONTEXT_REF_PATTERN };

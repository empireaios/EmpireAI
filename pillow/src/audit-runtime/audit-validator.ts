import { AUDIT_CATEGORIES, AUDRT_METADATA_VERSION } from "./paths.js";
import type { AudrtInput, AudrtValidationReport } from "./types.js";

/** Q10-14 and later are out of scope for Audit Runtime. */
const FORBIDDEN_MISSION_ID =
  /^(Q10-1[4-9]|Q10-[2-9]\d|Q10-\d{3,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const AUDIT_REF_PATTERN = /^audit:\/\/[A-Za-z0-9._\-/]+$/;
const EVIDENCE_REF_PATTERN = /^(evid|audit|msg|sched|trig|queue|ckpt|rec):\/\/[A-Za-z0-9._\-/]+$/;

export class AuditValidator {
  decide(input: AudrtInput): AudrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateAuditEvidence === true || input.fabricateEvidence === true) return "fail";
    if (input.deleteAuditRecords === true) return "fail";
    if (input.executeBusinessLogic === true) return "fail";
    if (input.modifyOperationalData === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.businessPayload !== undefined) return "fail";
    if (input.operationalPayload !== undefined) return "fail";
    return "pass";
  }

  validateInput(input: AudrtInput, started: number): AudrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Audit Runtime requires validated=true");
    if (input.fabricateAuditEvidence === true || input.fabricateEvidence === true) {
      errors.push("fabricated audit evidence is rejected");
    }
    if (input.deleteAuditRecords === true) {
      errors.push("deleting audit records is rejected — immutable append-only store");
    }
    if (input.executeBusinessLogic === true) {
      errors.push("business logic execution is rejected");
    }
    if (input.modifyOperationalData === true) {
      errors.push("modifying operational data is rejected");
    }
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.businessPayload !== undefined) {
      errors.push("business payload is rejected — structural audit refs only");
    }
    if (input.operationalPayload !== undefined) {
      errors.push("operational payload is rejected — Audit Runtime never modifies operational data");
    }
    if (input.auditReference && !AUDIT_REF_PATTERN.test(input.auditReference)) {
      errors.push("auditReference must be an audit://... reference — never raw secrets");
    }
    if (input.category && !(AUDIT_CATEGORIES as readonly string[]).includes(input.category)) {
      errors.push(`unsupported category: ${input.category}`);
    }
    if (input.evidenceRef && !EVIDENCE_REF_PATTERN.test(input.evidenceRef)) {
      errors.push("evidenceRef must be a structural reference (evid://, audit://, ...) — never secrets/payloads");
    }
    if (input.evidenceRefs) {
      for (const ref of input.evidenceRefs) {
        if (!EVIDENCE_REF_PATTERN.test(ref)) {
          errors.push(`evidenceRefs entry rejected — must be structural ref: ${ref}`);
        }
      }
    }
    if (input.supportingEvidence) {
      for (const ref of input.supportingEvidence) {
        if (
          /password|secret|api[_-]?key|bearer\s+/i.test(ref) ||
          (!ref.includes("://") && !ref.startsWith("metrics:") && !ref.startsWith("reason:") && !ref.startsWith("seed:"))
        ) {
          /* allow structural metric/reason/seed tags; reject secret-like free text */
          if (/password|secret|api[_-]?key|bearer\s+/i.test(ref)) {
            errors.push("supportingEvidence must never contain secrets");
          }
        }
      }
    }
    if (input.timestamp && Number.isNaN(Date.parse(input.timestamp))) {
      errors.push("timestamp must be a valid ISO timestamp when provided");
    }
    if (input.now && Number.isNaN(Date.parse(input.now))) {
      errors.push("now must be a valid ISO timestamp when provided");
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

  validateRecord(input: AudrtInput, started: number): AudrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.actionPerformed) errors.push("actionPerformed required for recording");
    if (!input.category) errors.push("category required for recording");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateEvidence(input: AudrtInput, started: number): AudrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.auditRecordId && !input.eventId) {
      errors.push("auditRecordId or eventId required to attach evidence");
    }
    if (!input.evidenceRef && !(input.evidenceRefs && input.evidenceRefs.length)) {
      errors.push("evidenceRef or evidenceRefs required");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: AudrtInput): boolean {
    return (
      input.fabricateAuditEvidence === true ||
      input.fabricateEvidence === true ||
      input.deleteAuditRecords === true ||
      input.executeBusinessLogic === true ||
      input.modifyOperationalData === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.exposeSecrets === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1014OrLater === true ||
      input.businessPayload !== undefined ||
      input.operationalPayload !== undefined ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(
        `Mission ${missionId} is out of scope — Audit Runtime stops at Q10-13; rejects Q10-14+`,
      );
    }
  }

  private pushBoundaryErrors(input: AudrtInput, errors: string[]) {
    if (input.fabricateAuditEvidence || input.fabricateEvidence) {
      errors.push("Audit Runtime must never fabricate audit evidence");
    }
    if (input.deleteAuditRecords) {
      errors.push("Audit Runtime must never delete audit records");
    }
    if (input.executeBusinessLogic) {
      errors.push("Audit Runtime must never execute business logic");
    }
    if (input.modifyOperationalData) {
      errors.push("Audit Runtime must never modify operational data");
    }
    if (input.bypassPillowGovernance) {
      errors.push("Audit Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Audit Runtime must never bypass Grand King approval");
    }
    if (input.exposeSecrets) errors.push("Audit Runtime must never expose secrets");
    if (input.overridePillow) errors.push("Audit Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Audit Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Audit Runtime must never override approved architecture");
    }
    if (input.implementQ1014OrLater) {
      errors.push("Audit Runtime must never implement Q10-14 or later");
    }
    if (input.businessPayload !== undefined) {
      errors.push("Audit Runtime must never accept business payloads");
    }
    if (input.operationalPayload !== undefined) {
      errors.push("Audit Runtime must never accept operational payloads");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: AudrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): AudrtValidationReport {
    return {
      validationReportId: nextValidationId(),
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: AUDRT_METADATA_VERSION,
    };
  }
}

let validationSeq = 0;
function nextValidationId() {
  validationSeq += 1;
  return `audrt-val-${validationSeq}`;
}

export function resetAudrtValidationSequenceForTesting() {
  validationSeq = 0;
}

export { FORBIDDEN_MISSION_ID, AUDIT_REF_PATTERN, EVIDENCE_REF_PATTERN };

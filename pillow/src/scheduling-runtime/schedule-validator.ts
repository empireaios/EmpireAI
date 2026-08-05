import { SCHRT_METADATA_VERSION, SCHEDULE_TYPES, TRIGGER_TYPES } from "./paths.js";
import type { SchrtInput, SchrtValidationReport } from "./types.js";

/** Q10-13 and later are out of scope for Scheduling Runtime. */
const FORBIDDEN_MISSION_ID =
  /^(Q10-1[3-9]|Q10-[2-9]\d|Q10-\d{3,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const AUDIT_REF_PATTERN = /^audit:\/\/[A-Za-z0-9._\-/]+$/;
const SIMPLE_CRON_PATTERN = /^(\d{1,2})\s+(\d{1,2})\s+\*\s+\*\s+\*$/;

export class ScheduleValidator {
  decide(input: SchrtInput): SchrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateExecutionTimes === true || input.fabricateTimes === true) return "fail";
    if (input.replaceQueueRuntime === true) return "fail";
    if (input.replaceMissionRuntime === true) return "fail";
    if (input.executeUnauthorizedWork === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.businessPayload !== undefined) return "fail";
    return "pass";
  }

  validateInput(input: SchrtInput, started: number): SchrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Scheduling Runtime requires validated=true");
    if (input.fabricateExecutionTimes === true || input.fabricateTimes === true) {
      errors.push("fabricated execution times are rejected");
    }
    if (input.replaceQueueRuntime === true) {
      errors.push("replacing Queue Runtime is rejected");
    }
    if (input.replaceMissionRuntime === true) {
      errors.push("replacing Mission Runtime is rejected");
    }
    if (input.executeUnauthorizedWork === true) {
      errors.push("unauthorized work execution is rejected");
    }
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.businessPayload !== undefined) {
      errors.push("business payload is rejected — structural scheduling refs only");
    }
    if (input.auditReference && !AUDIT_REF_PATTERN.test(input.auditReference)) {
      errors.push("auditReference must be an audit://... reference — never raw secrets");
    }
    if (input.scheduleType && !(SCHEDULE_TYPES as readonly string[]).includes(input.scheduleType)) {
      errors.push(`unsupported scheduleType: ${input.scheduleType}`);
    }
    if (input.triggerType && !(TRIGGER_TYPES as readonly string[]).includes(input.triggerType)) {
      errors.push(`unsupported triggerType: ${input.triggerType}`);
    }
    if (input.cronExpression && !SIMPLE_CRON_PATTERN.test(input.cronExpression.trim())) {
      errors.push('cronExpression must match simple form "M H * * *" (minute hour)');
    }
    if (input.nextExecution && Number.isNaN(Date.parse(input.nextExecution))) {
      errors.push("nextExecution must be a valid ISO timestamp when provided");
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

  validateCreate(input: SchrtInput, started: number): SchrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.scheduleType) errors.push("scheduleType required for createSchedule");
    if (!input.missionId) errors.push("missionId required for createSchedule");
    if (input.scheduleType === "cron" && !input.cronExpression) {
      errors.push("cronExpression required for cron schedules");
    }
    if (input.scheduleType === "event_driven" && !input.eventKey) {
      errors.push("eventKey required for event_driven schedules");
    }
    if (input.scheduleType === "one_time" && !input.nextExecution && !input.now) {
      errors.push("one_time schedules require nextExecution or now for deterministic computation");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateScheduleAction(input: SchrtInput, started: number): SchrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.scheduleId) errors.push("scheduleId required");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateEvent(input: SchrtInput, started: number): SchrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.eventKey) errors.push("eventKey required for triggerEvent");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: SchrtInput): boolean {
    return (
      input.fabricateExecutionTimes === true ||
      input.fabricateTimes === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.replaceQueueRuntime === true ||
      input.replaceMissionRuntime === true ||
      input.executeUnauthorizedWork === true ||
      input.exposeSecrets === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1013OrLater === true ||
      input.businessPayload !== undefined ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(
        `Mission ${missionId} is out of scope — Scheduling Runtime stops at Q10-12; rejects Q10-13+`,
      );
    }
  }

  private pushBoundaryErrors(input: SchrtInput, errors: string[]) {
    if (input.fabricateExecutionTimes || input.fabricateTimes) {
      errors.push("Scheduling Runtime must never fabricate execution times");
    }
    if (input.bypassPillowGovernance) {
      errors.push("Scheduling Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Scheduling Runtime must never bypass Grand King approval");
    }
    if (input.replaceQueueRuntime) {
      errors.push("Scheduling Runtime must never replace Queue Runtime");
    }
    if (input.replaceMissionRuntime) {
      errors.push("Scheduling Runtime must never replace Mission Runtime");
    }
    if (input.executeUnauthorizedWork) {
      errors.push("Scheduling Runtime must never execute unauthorized work");
    }
    if (input.exposeSecrets) errors.push("Scheduling Runtime must never expose secrets");
    if (input.overridePillow) errors.push("Scheduling Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Scheduling Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Scheduling Runtime must never override approved architecture");
    }
    if (input.implementQ1013OrLater) {
      errors.push("Scheduling Runtime must never implement Q10-13 or later");
    }
    if (input.businessPayload !== undefined) {
      errors.push("Scheduling Runtime must never accept business payloads");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: SchrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): SchrtValidationReport {
    return {
      validationReportId: `schrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: SCHRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, AUDIT_REF_PATTERN, SIMPLE_CRON_PATTERN };

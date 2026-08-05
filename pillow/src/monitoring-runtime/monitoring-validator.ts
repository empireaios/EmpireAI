import { MONRT_METADATA_VERSION } from "./paths.js";
import type { MonrtInput, MonrtValidationReport } from "./types.js";

/** Q10-11 and later are out of scope for Monitoring Runtime. */
const FORBIDDEN_MISSION_ID =
  /^(Q10-11|Q10-1[2-9]|Q10-[2-9]\d|Q10-\d{3,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const AUDIT_REF_PATTERN = /^audit:\/\/[A-Za-z0-9._\-/]+$/;

export class MonitoringValidator {
  decide(input: MonrtInput): MonrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateHealth === true) return "fail";
    if (input.suppressCriticalAlerts === true) return "fail";
    if (input.suppressCritical === true) return "fail";
    if (input.autoRepair === true) return "fail";
    if (input.replaceRecovery === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    return "pass";
  }

  validateInput(input: MonrtInput, started: number): MonrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Monitoring Runtime requires validated=true");
    if (input.fabricateHealth === true) {
      errors.push("fabricated health information is rejected");
    }
    if (input.suppressCriticalAlerts === true || input.suppressCritical === true) {
      errors.push("suppressing critical alerts is rejected");
    }
    if (input.autoRepair === true) {
      errors.push("automatic repair is rejected — Monitoring Runtime never repairs");
    }
    if (input.replaceRecovery === true) {
      errors.push("replacing recovery systems is rejected");
    }
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.auditReference && !AUDIT_REF_PATTERN.test(input.auditReference)) {
      errors.push("auditReference must be an audit://... reference — never raw secrets");
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

  validateRegister(input: MonrtInput, started: number): MonrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.componentId) errors.push("componentId required for registerComponent");
    if (!input.componentType) errors.push("componentType required for registerComponent");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateHeartbeat(input: MonrtInput, started: number): MonrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.monitoringId && !input.componentId) {
      errors.push("monitoringId or componentId required for recordHeartbeat");
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: MonrtInput): boolean {
    return (
      input.fabricateHealth === true ||
      input.suppressCriticalAlerts === true ||
      input.suppressCritical === true ||
      input.autoRepair === true ||
      input.replaceRecovery === true ||
      input.exposeSecrets === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1011OrLater === true ||
      input.executeBusinessLogic === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId)) ||
      (input.missionId != null && FORBIDDEN_MISSION_ID.test(input.missionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Monitoring Runtime stops at Q10-10`);
    }
  }

  private pushBoundaryErrors(input: MonrtInput, errors: string[]) {
    if (input.fabricateHealth) {
      errors.push("Monitoring Runtime must never fabricate health information");
    }
    if (input.suppressCriticalAlerts || input.suppressCritical) {
      errors.push("Monitoring Runtime must never suppress critical alerts");
    }
    if (input.autoRepair) {
      errors.push("Monitoring Runtime must never automatically repair failures");
    }
    if (input.replaceRecovery) {
      errors.push("Monitoring Runtime must never replace recovery systems");
    }
    if (input.exposeSecrets) errors.push("Monitoring Runtime must never expose secrets");
    if (input.bypassPillowGovernance) {
      errors.push("Monitoring Runtime must never bypass Pillow governance");
    }
    if (input.bypassGrandKingApproval) {
      errors.push("Monitoring Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("Monitoring Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Monitoring Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Monitoring Runtime must never override approved architecture");
    }
    if (input.implementQ1011OrLater) {
      errors.push("Monitoring Runtime must never implement Q10-11 or later");
    }
    if (input.executeBusinessLogic) {
      errors.push("Monitoring Runtime must never execute business logic");
    }
    this.rejectMissionId(input.targetMissionId, errors);
    this.rejectMissionId(input.missionId, errors);
  }

  private finalize(
    decision: MonrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): MonrtValidationReport {
    return {
      validationReportId: `monrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: MONRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, AUDIT_REF_PATTERN };

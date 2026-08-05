import {
  AUTH_METHODS_REQUIRING_CREDENTIAL,
  APIRT_METADATA_VERSION,
} from "./paths.js";
import type { ApirtInput, ApirtValidationReport, AuthMethod } from "./types.js";

/** Q10-07 and later are out of scope for API Runtime. */
const FORBIDDEN_MISSION_ID = /^(Q10-0[7-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const CREDENTIAL_REF_PATTERN = /^cred:\/\/[A-Za-z0-9._\-/]+$/;

export class ApiValidator {
  decide(input: ApirtInput): ApirtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateResponse === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.unauthorized === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: ApirtInput, started: number): ApirtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("API Runtime requires validated=true");
    if (input.fabricateResponse === true) errors.push("fabricated API responses are rejected");
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.unauthorized === true) errors.push("unauthorized operations are rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk API operations require grandKingApproved=true");
    }
    if (input.authMethod && this.requiresCredential(input.authMethod)) {
      if (!input.credentialReference) {
        errors.push(`authMethod ${input.authMethod} requires credentialReference`);
      } else if (!CREDENTIAL_REF_PATTERN.test(input.credentialReference)) {
        errors.push("credentialReference must be a cred://vault/... reference — never raw secrets");
      }
    }
    if (input.credentialReference && !CREDENTIAL_REF_PATTERN.test(input.credentialReference)) {
      errors.push("credentialReference must be a cred://vault/... reference — never raw secrets");
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

  validateRoute(input: ApirtInput, started: number): ApirtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.apiId) errors.push("apiId required for routeRequest");
    if (!input.method) errors.push("method required for routeRequest");
    if (!input.path) errors.push("path required for routeRequest");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateRegister(input: ApirtInput, started: number): ApirtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.apiId) errors.push("apiId required for registerProvider");
    if (!input.provider) errors.push("provider required for registerProvider");
    if (!input.serviceType) errors.push("serviceType required for registerProvider");
    if (!input.endpoint) errors.push("endpoint required for registerProvider");
    if (!input.authMethod) errors.push("authMethod required for registerProvider");
    if (input.authMethod && this.requiresCredential(input.authMethod) && !input.credentialReference) {
      errors.push(`authMethod ${input.authMethod} requires credentialReference`);
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: ApirtInput): boolean {
    return (
      input.fabricateResponse === true ||
      input.exposeSecrets === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1007OrLater === true ||
      input.unauthorized === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — API Runtime stops at Q10-06`);
    }
  }

  requiresCredential(authMethod: AuthMethod): boolean {
    return (AUTH_METHODS_REQUIRING_CREDENTIAL as readonly string[]).includes(authMethod);
  }

  private pushBoundaryErrors(input: ApirtInput, errors: string[]) {
    if (input.fabricateResponse) errors.push("API Runtime must never fabricate API responses");
    if (input.exposeSecrets) errors.push("API Runtime must never expose secrets");
    if (input.bypassPillowGovernance) errors.push("API Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) {
      errors.push("API Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("API Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("API Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("API Runtime must never override approved architecture");
    }
    if (input.implementQ1007OrLater) {
      errors.push("API Runtime must never implement Q10-07 or later");
    }
    this.rejectMissionId(input.targetMissionId, errors);
  }

  private finalize(
    decision: ApirtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ApirtValidationReport {
    return {
      validationReportId: `apirt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: APIRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, CREDENTIAL_REF_PATTERN };

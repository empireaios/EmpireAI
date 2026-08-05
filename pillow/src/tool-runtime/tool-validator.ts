import {
  AUTH_METHODS_REQUIRING_CREDENTIAL,
  TOOLRT_METADATA_VERSION,
} from "./paths.js";
import type { AuthMethod, ToolrtInput, ToolrtValidationReport } from "./types.js";

/** Q10-08 and later are out of scope for Tool Runtime. */
const FORBIDDEN_MISSION_ID = /^(Q10-0[8-9]|Q10-\d{2,}|Q1[1-9]-\d+|Q[2-9]\d-\d+)/i;

const CREDENTIAL_REF_PATTERN = /^cred:\/\/[A-Za-z0-9._\-/]+$/;

export class ToolValidator {
  decide(input: ToolrtInput): ToolrtValidationReport["decision"] {
    if (this.hasBoundaryViolation(input)) return "fail";
    if (input.validated === false) return "fail";
    if (input.fabricateResult === true) return "fail";
    if (input.exposeSecrets === true) return "fail";
    if (input.unauthorized === true) return "fail";
    if (input.highRisk === true && input.grandKingApproved !== true) return "fail";
    return "pass";
  }

  validateInput(input: ToolrtInput, started: number): ToolrtValidationReport {
    const decision = this.decide(input);
    const errors: string[] = [];
    const warnings: string[] = [];

    this.pushBoundaryErrors(input, errors);
    if (input.validated === false) errors.push("Tool Runtime requires validated=true");
    if (input.fabricateResult === true) errors.push("fabricated tool execution results are rejected");
    if (input.exposeSecrets === true) errors.push("exposing secrets is rejected");
    if (input.unauthorized === true) errors.push("unauthorized operations are rejected");
    if (input.highRisk === true && input.grandKingApproved !== true) {
      errors.push("High-risk tool operations require grandKingApproved=true");
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

  validateInvoke(input: ToolrtInput, started: number): ToolrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.toolId) errors.push("toolId required for invokeTool");
    if (!input.action) errors.push("action required for invokeTool");
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  validateRegister(input: ToolrtInput, started: number): ToolrtValidationReport {
    const base = this.validateInput(input, started);
    if (base.decision === "fail") return base;
    const errors = [...base.errors];
    if (!input.toolId) errors.push("toolId required for registerTool");
    if (!input.toolName) errors.push("toolName required for registerTool");
    if (!input.toolCategory) errors.push("toolCategory required for registerTool");
    if (!input.authMethod) errors.push("authMethod required for registerTool");
    if (input.authMethod && this.requiresCredential(input.authMethod) && !input.credentialReference) {
      errors.push(`authMethod ${input.authMethod} requires credentialReference`);
    }
    if (errors.length > base.errors.length) {
      return this.finalize("fail", errors, base.warnings, started);
    }
    return base;
  }

  hasBoundaryViolation(input: ToolrtInput): boolean {
    return (
      input.fabricateResult === true ||
      input.exposeSecrets === true ||
      input.bypassPillowGovernance === true ||
      input.bypassGrandKingApproval === true ||
      input.overridePillow === true ||
      input.overrideGrandKing === true ||
      input.overrideApprovedArchitecture === true ||
      input.implementQ1008OrLater === true ||
      input.unauthorized === true ||
      (input.targetMissionId != null && FORBIDDEN_MISSION_ID.test(input.targetMissionId))
    );
  }

  rejectMissionId(missionId: string | null | undefined, errors: string[]) {
    if (missionId && FORBIDDEN_MISSION_ID.test(missionId)) {
      errors.push(`Mission ${missionId} is out of scope — Tool Runtime stops at Q10-07`);
    }
  }

  requiresCredential(authMethod: AuthMethod): boolean {
    return (AUTH_METHODS_REQUIRING_CREDENTIAL as readonly string[]).includes(authMethod);
  }

  private pushBoundaryErrors(input: ToolrtInput, errors: string[]) {
    if (input.fabricateResult) errors.push("Tool Runtime must never fabricate execution results");
    if (input.exposeSecrets) errors.push("Tool Runtime must never expose secrets");
    if (input.bypassPillowGovernance) errors.push("Tool Runtime must never bypass Pillow governance");
    if (input.bypassGrandKingApproval) {
      errors.push("Tool Runtime must never bypass Grand King approval");
    }
    if (input.overridePillow) errors.push("Tool Runtime must never override Pillow");
    if (input.overrideGrandKing) errors.push("Tool Runtime must never override Grand King");
    if (input.overrideApprovedArchitecture) {
      errors.push("Tool Runtime must never override approved architecture");
    }
    if (input.implementQ1008OrLater) {
      errors.push("Tool Runtime must never implement Q10-08 or later");
    }
    this.rejectMissionId(input.targetMissionId, errors);
  }

  private finalize(
    decision: ToolrtValidationReport["decision"],
    errors: string[],
    warnings: string[],
    started: number,
  ): ToolrtValidationReport {
    return {
      validationReportId: `toolrt-val-${Date.now()}`,
      validationTimestamp: new Date().toISOString(),
      decision,
      errors,
      warnings,
      durationMs: Date.now() - started,
      metadataVersion: TOOLRT_METADATA_VERSION,
    };
  }
}

export { FORBIDDEN_MISSION_ID, CREDENTIAL_REF_PATTERN };

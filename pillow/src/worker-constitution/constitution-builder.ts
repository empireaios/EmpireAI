import type { WorkerConstitutionConfiguration } from "./configuration.js";
import { CONSTITUTION_VERSION, WCT_METADATA_VERSION } from "./paths.js";
import type {
  ComplianceDecision,
  WorkerConstitutionDefinition,
  WorkerConstitutionInput,
  WorkerLifecycleStage,
} from "./types.js";

export type ComplianceEvaluation = {
  workerId: string;
  workerName: string;
  department: string;
  lifecycleStage: WorkerLifecycleStage;
  complianceDecision: ComplianceDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Constitution definition and compliance helpers for Q1-01. */
export class ConstitutionBuilder {
  define(config: WorkerConstitutionConfiguration): WorkerConstitutionDefinition {
    return {
      constitutionVersion: config.constitutionVersion || CONSTITUTION_VERSION,
      workerIdentity: config.workerIdentity,
      workerPurpose: config.workerPurpose,
      workerResponsibilities: [...config.workerResponsibilities],
      workerAuthority: [...config.workerAuthority],
      workerRestrictions: [...config.workerRestrictions],
      workerObligations: [...config.workerObligations],
      communicationStandards: [...config.communicationStandards],
      reportingStandards: [...config.reportingStandards],
      qualityStandards: [...config.qualityStandards],
      governanceStandards: [...config.governanceStandards],
      escalationStandards: [...config.escalationStandards],
      auditStandards: [...config.auditStandards],
      traceabilityStandards: [...config.traceabilityStandards],
      metadataVersion: WCT_METADATA_VERSION,
      constitutionalRules: [...config.constitutionalRules],
      lifecycleStages: [...config.lifecycleStages],
      neverExecuteWorkerTasks: true,
      neverReplaceWorkerQualityStandard: true,
      neverReplaceGovernance: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluateCompliance(
    input: WorkerConstitutionInput,
    config: WorkerConstitutionConfiguration,
  ): ComplianceEvaluation {
    const rules = unique(input.rules ?? config.constitutionalRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];

    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    let complianceDecision: ComplianceDecision = "compliant";
    if (failed.length === 0) complianceDecision = "compliant";
    else if (failed.length <= Math.ceil(rules.length / 3)) {
      complianceDecision = "partially_compliant";
    } else complianceDecision = "non_compliant";

    return {
      workerId: input.workerId?.trim() || "worker-unspecified",
      workerName: input.workerName?.trim() || input.workerId?.trim() || "Unnamed Worker",
      department: input.department?.trim() || "unspecified",
      lifecycleStage: normalizeLifecycle(input.lifecycleStage) ?? "registered",
      complianceDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerConstitutionInput,
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    switch (rule) {
      case "governed_by_pillow":
        return input.governedByPillow !== false;
      case "follow_executive_instructions":
        return input.followsExecutiveInstructions !== false;
      case "never_bypass_pillow":
        return input.neverBypassesPillow !== false && input.overridePillow !== true;
      case "never_execute_outside_authority":
        return input.withinAuthority !== false;
      case "report_all_work":
        return input.reportsAllWork !== false;
      case "preserve_audit_history":
        return input.preservesAuditHistory !== false;
      case "preserve_traceability":
        return input.preservesTraceability !== false;
      case "follow_worker_quality_standard":
        return input.followsQualityStandard !== false;
      case "follow_worker_self_critique_protocol":
        return input.followsSelfCritiqueProtocol !== false;
      case "participate_peer_review_when_required":
        return input.participatesPeerReviewWhenRequired !== false;
      case "use_approved_tools_only":
        return input.usesApprovedToolsOnly !== false;
      case "escalate_beyond_authority":
        return input.escalatesBeyondAuthority !== false;
      case "remain_certifiable":
        return input.remainsCertifiable !== false;
      default:
        return true;
    }
  }
}

function normalizeLifecycle(
  value: string | null | undefined,
): WorkerLifecycleStage | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "registered" ||
    normalized === "initialized" ||
    normalized === "active" ||
    normalized === "suspended" ||
    normalized === "retired"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

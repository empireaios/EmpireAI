import type { WorkforceCertificationMonitorConfiguration } from "./configuration.js";
import type {
  CertificationStatus,
  WorkforceCertificationMonitorInput,
} from "./types.js";

export type CertificationEvaluation = {
  workerId: string;
  workerName: string;
  department: string;
  certificationStatus: CertificationStatus;
  availabilityStatus: string;
  capabilityStatus: string;
  toolAccessStatus: string;
  governanceStatus: string;
  runtimeHealth: string;
  qualityCompliance: string;
  selfCritiqueCompliance: string;
  dependencyHealth: string;
  certificationIssues: string[];
  recommendedAction: string;
  checksPerformed: string[];
  checksFailed: string[];
  registered: boolean;
  reachable: boolean;
};

/** Pure workforce certification evaluation helpers for Q0-29. */
export class Certifier {
  evaluate(
    input: WorkforceCertificationMonitorInput,
    config: WorkforceCertificationMonitorConfiguration,
  ): CertificationEvaluation {
    const checks = unique(input.checks ?? config.certificationChecks);
    const registered = input.registered !== false;
    const available = input.available !== false;
    const reachable = input.reachable !== false;
    const capabilitiesRegistered = input.capabilitiesRegistered !== false;
    const requiredToolsAccessible = input.requiredToolsAccessible !== false;
    const governanceCompliant = input.governanceCompliant !== false;
    const qualityStandardCompliant = input.qualityStandardCompliant !== false;
    const selfCritiqueCompliant = input.selfCritiqueCompliant !== false;
    const runtimeHealthy = input.runtimeHealthy !== false;
    const dependenciesHealthy = input.dependenciesHealthy !== false;
    const executiveReady = input.executiveReady !== false;

    const checksFailed = this.failedChecks(checks, {
      registered,
      available,
      reachable,
      capabilitiesRegistered,
      requiredToolsAccessible,
      governanceCompliant,
      qualityStandardCompliant,
      selfCritiqueCompliant,
      runtimeHealthy,
      dependenciesHealthy,
      executiveReady,
      config,
    });

    const certificationIssues = unique([
      ...(input.certifiedIssues ?? []),
      ...checksFailed.map((c) => `failed_check:${c}`),
    ]);

    const certificationStatus = this.decideStatus({
      input,
      registered,
      available,
      reachable,
      checksFailed,
      certificationIssues,
    });

    return {
      workerId: input.workerId?.trim() || "worker-unspecified",
      workerName: input.workerName?.trim() || input.workerId?.trim() || "Unnamed Worker",
      department: input.department?.trim() || "unspecified",
      certificationStatus,
      availabilityStatus: statusLabel(available, reachable, "available", "unavailable"),
      capabilityStatus: statusLabel(
        capabilitiesRegistered,
        true,
        "capabilities_registered",
        "capabilities_missing",
      ),
      toolAccessStatus: statusLabel(
        requiredToolsAccessible,
        true,
        "tools_accessible",
        "tools_blocked",
      ),
      governanceStatus: statusLabel(
        governanceCompliant,
        true,
        "governance_compliant",
        "governance_non_compliant",
      ),
      runtimeHealth: statusLabel(runtimeHealthy, true, "healthy", "unhealthy"),
      qualityCompliance: statusLabel(
        qualityStandardCompliant,
        true,
        "quality_compliant",
        "quality_non_compliant",
      ),
      selfCritiqueCompliance: statusLabel(
        selfCritiqueCompliant,
        true,
        "self_critique_compliant",
        "self_critique_non_compliant",
      ),
      dependencyHealth: statusLabel(dependenciesHealthy, true, "dependencies_healthy", "dependencies_unhealthy"),
      certificationIssues,
      recommendedAction: this.recommend(certificationStatus, checksFailed),
      checksPerformed: checks,
      checksFailed,
      registered,
      reachable,
    };
  }

  private failedChecks(
    checks: string[],
    ctx: {
      registered: boolean;
      available: boolean;
      reachable: boolean;
      capabilitiesRegistered: boolean;
      requiredToolsAccessible: boolean;
      governanceCompliant: boolean;
      qualityStandardCompliant: boolean;
      selfCritiqueCompliant: boolean;
      runtimeHealthy: boolean;
      dependenciesHealthy: boolean;
      executiveReady: boolean;
      config: WorkforceCertificationMonitorConfiguration;
    },
  ): string[] {
    const failed: string[] = [];
    for (const check of checks) {
      switch (check) {
        case "registration":
          if (ctx.config.requireRegistration && !ctx.registered) failed.push(check);
          break;
        case "reachability":
          if (
            (ctx.config.requireReachability && !ctx.reachable) ||
            (ctx.config.availabilityRulesEnabled && !ctx.available)
          ) {
            failed.push(check);
          }
          break;
        case "capability":
          if (ctx.config.requireCapabilities && !ctx.capabilitiesRegistered) {
            failed.push(check);
          }
          break;
        case "approved_tool_access":
          if (ctx.config.requireToolAccess && !ctx.requiredToolsAccessible) {
            failed.push(check);
          }
          break;
        case "runtime_health":
          if (ctx.config.requireRuntimeHealth && !ctx.runtimeHealthy) failed.push(check);
          break;
        case "governance_compliance":
          if (ctx.config.requireGovernance && !ctx.governanceCompliant) failed.push(check);
          break;
        case "quality_standard_compliance":
          if (ctx.config.requireQualityCompliance && !ctx.qualityStandardCompliant) {
            failed.push(check);
          }
          break;
        case "self_critique_compliance":
          if (ctx.config.requireSelfCritiqueCompliance && !ctx.selfCritiqueCompliant) {
            failed.push(check);
          }
          break;
        case "dependency_health":
          if (ctx.config.requireDependencyHealth && !ctx.dependenciesHealthy) {
            failed.push(check);
          }
          break;
        case "executive_readiness":
          if (
            !ctx.executiveReady ||
            !ctx.registered ||
            !ctx.reachable ||
            !ctx.governanceCompliant
          ) {
            failed.push(check);
          }
          break;
        default:
          break;
      }
    }
    return unique(failed);
  }

  private decideStatus(params: {
    input: WorkforceCertificationMonitorInput;
    registered: boolean;
    available: boolean;
    reachable: boolean;
    checksFailed: string[];
    certificationIssues: string[];
  }): CertificationStatus {
    const forced = normalizeStatus(params.input.forceStatus);
    if (forced) return forced;

    if (!params.registered || (!params.available && !params.reachable)) {
      return "offline";
    }
    if (!params.reachable) return "offline";

    const critical = params.checksFailed.filter((c) =>
      [
        "governance_compliance",
        "quality_standard_compliance",
        "self_critique_compliance",
        "runtime_health",
      ].includes(c),
    );
    if (critical.length >= 2 || params.checksFailed.length >= 5) {
      return "decertified";
    }
    if (critical.length === 1 || params.checksFailed.includes("approved_tool_access")) {
      return "suspended";
    }
    if (params.checksFailed.length > 0) {
      return params.checksFailed.length <= 2
        ? "provisionally_certified"
        : "pending_review";
    }
    return "certified";
  }

  private recommend(status: CertificationStatus, checksFailed: string[]): string {
    switch (status) {
      case "certified":
        return "assign_production_work";
      case "provisionally_certified":
        return "limit_to_provisional_work";
      case "suspended":
        return checksFailed.includes("governance_compliance")
          ? "review_governance"
          : "suspend_assignment";
      case "decertified":
        return "recertify_worker";
      case "offline":
        return "restore_reachability";
      case "pending_review":
        return "await_review";
      default:
        return "await_review";
    }
  }
}

function statusLabel(
  primary: boolean,
  secondary: boolean,
  ok: string,
  bad: string,
): string {
  return primary && secondary ? ok : bad;
}

function normalizeStatus(value: string | null | undefined): CertificationStatus | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "certified" ||
    normalized === "provisionally_certified" ||
    normalized === "suspended" ||
    normalized === "decertified" ||
    normalized === "pending_review" ||
    normalized === "offline"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

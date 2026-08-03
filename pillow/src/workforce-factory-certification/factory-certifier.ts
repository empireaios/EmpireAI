import type { WorkforceFactoryCertificationConfiguration } from "./configuration.js";
import {
  INTEGRATION_DOMAINS,
  WORKFORCE_FACTORY_COMPONENTS,
  WORKFORCE_FACTORY_VERSION,
  WORKFORCE_GOVERNANCE_RULES,
} from "./paths.js";
import type {
  CertificationLevel,
  ComponentProbeResult,
  ComponentVerification,
  GovernanceVerification,
  IntegrationVerification,
  WorkforceFactoryCertificationInput,
} from "./types.js";

export type FactoryCertificationEvaluation = {
  workforceFactoryVersion: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  integrationStatus: string;
  workforceReadiness: string;
  governanceCompliance: string;
  remainingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel;
  q1ProductionReady: boolean;
  q2ReadinessConfirmed: boolean;
};

/** Pure Q1 factory certification evaluation — acceptance gate only. */
export class WorkforceFactoryCertifier {
  evaluate(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ): FactoryCertificationEvaluation {
    const componentVerifications = this.verifyComponents(input, config);
    const integrationVerifications = this.verifyIntegration(
      input,
      config,
      componentVerifications,
    );
    const governanceVerifications = this.verifyGovernance(
      input,
      config,
      componentVerifications,
    );

    const componentsPassed = componentVerifications
      .filter((v) => v.result === "pass")
      .map((v) => v.componentId);
    const componentsWarned = componentVerifications
      .filter((v) => v.result === "warning")
      .map((v) => v.componentId);
    const componentsFailed = componentVerifications
      .filter((v) => v.result === "fail")
      .map((v) => v.componentId);

    const domainFails = integrationVerifications.filter((v) => v.result === "fail").length;
    const domainWarnings = integrationVerifications.filter((v) => v.result === "warning").length;
    const governanceFails = governanceVerifications.filter((v) => v.result === "fail").length;
    const governanceWarnings = governanceVerifications.filter((v) => v.result === "warning").length;

    const finalCertificationResult = this.decideLevel({
      input,
      config,
      failCount: componentsFailed.length + domainFails + governanceFails,
      warnCount: componentsWarned.length + domainWarnings + governanceWarnings,
      componentFails: componentsFailed.length,
      domainFails,
    });

    const remainingRisks = unique([
      ...componentsFailed.map((id) => `component_failed:${id}`),
      ...componentsWarned.map((id) => `component_warning:${id}`),
      ...integrationVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `integration_${v.result}:${v.domain}`),
      ...governanceVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `governance_${v.result}:${v.rule}`),
    ]);

    const recommendations = this.recommend(finalCertificationResult, remainingRisks);
    const q1ProductionReady =
      finalCertificationResult === "certified" ||
      finalCertificationResult === "certified_with_warnings";
    const q2ReadinessConfirmed = q1ProductionReady;

    return {
      workforceFactoryVersion: config.workforceFactoryVersion || WORKFORCE_FACTORY_VERSION,
      componentsTested: componentVerifications.map((v) => v.componentId),
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentVerifications,
      integrationVerifications,
      governanceVerifications,
      integrationStatus: this.integrationStatus(integrationVerifications),
      workforceReadiness: this.readinessAssessment(finalCertificationResult, q1ProductionReady),
      governanceCompliance: this.governanceCompliance(governanceVerifications),
      remainingRisks,
      recommendations,
      finalCertificationResult,
      q1ProductionReady,
      q2ReadinessConfirmed,
    };
  }

  private verifyComponents(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = WORKFORCE_FACTORY_COMPONENTS.filter((c) =>
      config.workforceFactoryComponents.includes(c.id),
    );
    const extras = config.workforceFactoryComponents
      .filter((id) => !catalog.some((c) => c.id === id))
      .map((id) => ({ id, label: id, missionId: "ext" }));

    return [...catalog, ...extras].map((component) => {
      const override = overrides.get(component.id);
      let result = normalizeProbe(override?.result) ?? "pass";
      if (!override?.result) {
        if (failed.has(component.id)) result = "fail";
        else if (warned.has(component.id)) result = "warning";
      }
      return {
        componentId: component.id,
        label: component.label,
        missionId: component.missionId,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${component.label} operational`
            : result === "warning"
              ? `${component.label} degraded but available`
              : `${component.label} failed certification probe`),
      };
    });
  }

  private verifyIntegration(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      constitution_and_charter: ["worker-constitution", "organization-charter"],
      role_and_skill_taxonomy: ["role-taxonomy", "skill-taxonomy"],
      authority_and_responsibility: ["authority-matrix", "responsibility-matrix"],
      registry_and_lifecycle: ["worker-registry", "worker-lifecycle"],
      assignment_and_monitoring: ["worker-assignment-engine", "worker-monitoring"],
      performance_and_recovery: ["worker-performance-review", "worker-recovery-system"],
      cross_component_integration: WORKFORCE_FACTORY_COMPONENTS.map((c) => c.id),
      pillow_governance: [
        "worker-constitution",
        "authority-matrix",
        "responsibility-matrix",
        "worker-lifecycle",
      ],
      workforce_readiness: [
        "worker-registry",
        "worker-assignment-engine",
        "worker-monitoring",
        "worker-recovery-system",
      ],
    };

    const domains = unique([...INTEGRATION_DOMAINS, ...config.integrationDomains]);

    return domains.map((domain) => {
      const override = overrides.get(domain);
      let result = normalizeProbe(override?.result);
      if (!result) {
        if (failed.has(domain)) result = "fail";
        else if (warned.has(domain)) result = "warning";
        else {
          const related = domainComponents[domain] ?? [];
          const relatedResults = components.filter((c) => related.includes(c.componentId));
          if (relatedResults.some((c) => c.result === "fail")) result = "fail";
          else if (relatedResults.some((c) => c.result === "warning")) result = "warning";
          else result = "pass";
        }
      }
      return {
        domain,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${domain} integration healthy`
            : result === "warning"
              ? `${domain} integration degraded`
              : `${domain} integration failed`),
      };
    });
  }

  private verifyGovernance(
    input: WorkforceFactoryCertificationInput,
    config: WorkforceFactoryCertificationConfiguration,
    components: ComponentVerification[],
  ): GovernanceVerification[] {
    const failed = new Set(unique(input.failedGovernanceRules ?? []));
    const warned = new Set(unique(input.warningGovernanceRules ?? []));
    const overrides = new Map(
      (input.governanceOverrides ?? []).map((o) => [o.rule, o] as const),
    );

    const ruleComponents: Record<string, string[]> = {
      every_worker_can_be_registered: ["worker-registry"],
      every_worker_follows_worker_constitution: ["worker-constitution"],
      every_worker_belongs_to_organization_charter: ["organization-charter"],
      every_worker_inherits_a_role: ["role-taxonomy"],
      every_worker_inherits_skills: ["skill-taxonomy"],
      every_worker_respects_authority_matrix: ["authority-matrix"],
      every_worker_respects_responsibility_matrix: ["responsibility-matrix"],
      every_worker_follows_worker_lifecycle: ["worker-lifecycle"],
      every_worker_can_be_assigned: ["worker-assignment-engine"],
      every_worker_can_be_monitored: ["worker-monitoring"],
      every_worker_can_be_performance_reviewed: ["worker-performance-review"],
      every_worker_can_be_recovered: ["worker-recovery-system"],
      every_worker_remains_fully_governed_by_pillow: [
        "worker-constitution",
        "authority-matrix",
        "worker-lifecycle",
      ],
    };

    const rules = unique([...WORKFORCE_GOVERNANCE_RULES, ...config.governanceRules]);

    return rules.map((rule) => {
      const override = overrides.get(rule);
      let result = normalizeProbe(override?.result);
      if (!result) {
        if (failed.has(rule)) result = "fail";
        else if (warned.has(rule)) result = "warning";
        else {
          const related = ruleComponents[rule] ?? [];
          const relatedResults = components.filter((c) => related.includes(c.componentId));
          if (relatedResults.some((c) => c.result === "fail")) result = "fail";
          else if (relatedResults.some((c) => c.result === "warning")) result = "warning";
          else result = "pass";
        }
      }
      return {
        rule,
        result,
        detail:
          override?.detail?.trim() ||
          (result === "pass"
            ? `${rule} satisfied`
            : result === "warning"
              ? `${rule} degraded`
              : `${rule} failed`),
      };
    });
  }

  private decideLevel(params: {
    input: WorkforceFactoryCertificationInput;
    config: WorkforceFactoryCertificationConfiguration;
    failCount: number;
    warnCount: number;
    componentFails: number;
    domainFails: number;
  }): CertificationLevel {
    const forced = normalizeLevel(params.input.forceResult);
    if (forced) return forced;

    if (params.failCount === 0 && params.warnCount === 0) return "certified";
    if (
      params.failCount === 0 &&
      params.warnCount > 0 &&
      params.warnCount <= params.config.maxWarningsForCertifiedWithWarnings
    ) {
      return "certified_with_warnings";
    }
    if (
      params.componentFails <= params.config.maxFailuresForProvisional &&
      params.domainFails <= params.config.maxFailuresForProvisional
    ) {
      return params.failCount === 0 ? "certified_with_warnings" : "provisionally_certified";
    }
    return "failed_certification";
  }

  private integrationStatus(verifications: IntegrationVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_integrated";
    if (verifications.some((v) => v.result === "fail")) return "integration_failed";
    return "integration_degraded";
  }

  private readinessAssessment(level: CertificationLevel, ready: boolean): string {
    if (ready && level === "certified") {
      return "Q1 Workforce Factory Foundation is production-ready under Pillow.";
    }
    if (ready) {
      return "Q1 is production-ready with warnings; monitor degraded components.";
    }
    if (level === "provisionally_certified") {
      return "Q1 is provisionally certified; resolve remaining failures before full production.";
    }
    return "Q1 failed Workforce Factory Certification; do not begin Q2.";
  }

  private governanceCompliance(verifications: GovernanceVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_compliant";
    if (verifications.some((v) => v.result === "fail")) return "governance_failed";
    return "governance_degraded";
  }

  private recommend(level: CertificationLevel, risks: string[]): string[] {
    if (level === "certified") {
      return ["Q1 certified. Proceed to Q2 only after founder authorization."];
    }
    if (level === "certified_with_warnings") {
      return [
        "Monitor warned Workforce Factory components continuously.",
        "Clear warnings before scaling worker manufacturing volume.",
      ];
    }
    if (level === "provisionally_certified") {
      return [
        "Remediate failed Q1 components before declaring full Workforce Factory readiness.",
        ...risks.slice(0, 5).map((r) => `Investigate ${r}`),
      ];
    }
    return [
      "Do not begin Q2 implementation.",
      "Repair failed Workforce Factory components and re-run Workforce Factory Certification.",
      ...risks.slice(0, 5).map((r) => `Blocker: ${r}`),
    ];
  }
}

function normalizeProbe(value: string | null | undefined): ComponentProbeResult | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "pass" || normalized === "warning" || normalized === "fail") {
    return normalized;
  }
  return null;
}

function normalizeLevel(value: string | null | undefined): CertificationLevel | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (
    normalized === "certified" ||
    normalized === "certified_with_warnings" ||
    normalized === "provisionally_certified" ||
    normalized === "failed_certification"
  ) {
    return normalized;
  }
  return null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

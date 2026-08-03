import type { UnifiedWorkforceCertificationConfiguration } from "./configuration.js";
import {
  EXECUTIVE_COMPONENTS,
  EXECUTIVE_FACTORY_VERSION,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type {
  CertificationLevel,
  ComponentProbeResult,
  ComponentVerification,
  IntegrationVerification,
  UnifiedWorkforceCertificationInput,
} from "./types.js";

export type FactoryCertificationEvaluation = {
  executiveFactoryVersion: string;
  executiveComponentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  integrationStatus: string;
  readinessAssessment: string;
  executiveHealth: string;
  remainingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel;
  q0ProductionReady: boolean;
};

/** Pure Q0 factory certification evaluation — acceptance gate only. */
export class FactoryCertifier {
  evaluate(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ): FactoryCertificationEvaluation {
    const componentVerifications = this.verifyComponents(input, config);
    const integrationVerifications = this.verifyIntegration(
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

    const finalCertificationResult = this.decideLevel({
      input,
      config,
      failCount: componentsFailed.length + domainFails,
      warnCount: componentsWarned.length + domainWarnings,
      componentFails: componentsFailed.length,
      domainFails,
    });

    const remainingRisks = unique([
      ...componentsFailed.map((id) => `component_failed:${id}`),
      ...componentsWarned.map((id) => `component_warning:${id}`),
      ...integrationVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `integration_${v.result}:${v.domain}`),
    ]);

    const recommendations = this.recommend(finalCertificationResult, remainingRisks);
    const q0ProductionReady =
      finalCertificationResult === "certified" ||
      finalCertificationResult === "certified_with_warnings";

    return {
      executiveFactoryVersion: config.executiveFactoryVersion || EXECUTIVE_FACTORY_VERSION,
      executiveComponentsTested: componentVerifications.map((v) => v.componentId),
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentVerifications,
      integrationVerifications,
      integrationStatus: this.integrationStatus(integrationVerifications),
      readinessAssessment: this.readinessAssessment(finalCertificationResult, q0ProductionReady),
      executiveHealth: this.executiveHealth(
        componentsFailed.length,
        componentsWarned.length,
        domainFails,
      ),
      remainingRisks,
      recommendations,
      finalCertificationResult,
      q0ProductionReady,
    };
  }

  private verifyComponents(
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = EXECUTIVE_COMPONENTS.filter((c) =>
      config.executiveComponents.includes(c.id),
    );
    const extras = config.executiveComponents
      .filter((id) => !catalog.some((c) => c.id === id))
      .map((id) => ({ id, label: id, missionId: "ext" }));

    return [...catalog, ...extras].map((component) => {
      const override = overrides.get(component.id);
      let result = normalizeProbe(override?.result) ?? "pass";
      if (!override?.result) {
        if (failed.has(component.id)) result = "fail";
        else if (warned.has(component.id)) result = "warning";
      }
      if (input.componentId?.trim() && input.componentId.trim() !== component.id) {
        // When verifying a single component, mark others as pass unless overridden.
        if (!override && !failed.has(component.id) && !warned.has(component.id)) {
          result = "pass";
        }
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
    input: UnifiedWorkforceCertificationInput,
    config: UnifiedWorkforceCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      executive_communication: [
        "inter-worker-messaging",
        "knowledge-sharing-bus",
        "task-negotiation-protocol",
      ],
      executive_memory: ["execution-memory", "decision-memory", "experience-replay-engine"],
      executive_routing: ["approval-router", "skill-tool-router", "escalation-framework"],
      executive_reporting: ["executive-reporting-runtime", "executive-audit-engine"],
      executive_governance: [
        "workforce-access-manager",
        "peer-review-runtime",
        "worker-quality-standard",
      ],
      executive_orchestration: [
        "workforce-orchestrator",
        "workforce-operating-system",
        "mission-coordination-engine",
        "executive-command-center",
      ],
      executive_reasoning: [
        "collective-reasoning-engine",
        "decision-engine",
        "strategic-recommendation-engine",
        "executive-planner",
      ],
      executive_quality_controls: [
        "worker-quality-standard",
        "worker-self-critique-protocol",
        "peer-review-runtime",
      ],
      executive_certification: ["workforce-certification-monitor"],
    };

    const domains = unique([
      ...INTEGRATION_DOMAINS,
      ...config.integrationDomains,
    ]);

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

  private decideLevel(params: {
    input: UnifiedWorkforceCertificationInput;
    config: UnifiedWorkforceCertificationConfiguration;
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
      return "Q0 Executive Intelligence Factory is production-ready under Pillow.";
    }
    if (ready) {
      return "Q0 is production-ready with warnings; monitor degraded components.";
    }
    if (level === "provisionally_certified") {
      return "Q0 is provisionally certified; resolve remaining failures before full production.";
    }
    return "Q0 failed unified certification; do not begin Q1.";
  }

  private executiveHealth(fails: number, warns: number, domainFails: number): string {
    if (fails === 0 && domainFails === 0 && warns === 0) return "healthy";
    if (fails === 0 && domainFails === 0) return "degraded";
    if (fails + domainFails <= 2) return "at_risk";
    return "critical";
  }

  private recommend(level: CertificationLevel, risks: string[]): string[] {
    if (level === "certified") {
      return ["Proceed to AI Workforce Foundation (Q1) planning only after founder authorization."];
    }
    if (level === "certified_with_warnings") {
      return [
        "Monitor warned components continuously via Workforce Certification Monitor.",
        "Clear warnings before scaling production assignment volume.",
      ];
    }
    if (level === "provisionally_certified") {
      return [
        "Remediate failed components before declaring full Q0 production readiness.",
        ...risks.slice(0, 5).map((r) => `Investigate ${r}`),
      ];
    }
    return [
      "Do not begin Q1 implementation.",
      "Repair failed Executive Intelligence components and re-run Unified Workforce Certification.",
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

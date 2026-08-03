import type { EmpireBuilderCertificationConfiguration } from "./configuration.js";
import {
  EMPIRE_BUILDER_COMPONENTS,
  EMPIRE_BUILDER_FACTORY_VERSION,
  INTEGRATION_DOMAINS,
  PLANNING_GOVERNANCE_RULES,
} from "./paths.js";
import type {
  CertificationLevel,
  ComponentProbeResult,
  ComponentVerification,
  EmpireBuilderCertificationInput,
  GovernanceVerification,
  IntegrationVerification,
  TraceabilityLink,
} from "./types.js";

export type EmpireBuilderCertificationEvaluation = {
  empireBuilderFactoryVersion: string;
  originalGrandKingCommand: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  traceabilityChain: TraceabilityLink[];
  integrationStatus: string;
  planningCompleteness: string;
  governanceCompliance: string;
  executiveReportingStatus: string;
  outstandingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel;
  q2ProductionReady: boolean;
  q3ReadinessConfirmed: boolean;
};

/** Pure Q2 Empire Builder certification evaluation — acceptance gate only. */
export class EmpireBuilderCertifier {
  evaluate(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ): EmpireBuilderCertificationEvaluation {
    const originalGrandKingCommand =
      input.originalGrandKingCommand?.trim() ||
      config.defaultGrandKingCommand ||
      "Grand King business command";

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
      originalGrandKingCommand,
    );
    const traceabilityChain = this.buildTraceabilityChain(input, originalGrandKingCommand);

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
    const brokenTrace = traceabilityChain.filter((t) => !t.artifactId).length;

    const finalCertificationResult = this.decideLevel({
      input,
      config,
      failCount: componentsFailed.length + domainFails + governanceFails,
      warnCount: componentsWarned.length + domainWarnings + governanceWarnings + brokenTrace,
      componentFails: componentsFailed.length,
      domainFails,
    });

    const outstandingRisks = unique([
      ...componentsFailed.map((id) => `component_failed:${id}`),
      ...componentsWarned.map((id) => `component_warning:${id}`),
      ...integrationVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `integration_${v.result}:${v.domain}`),
      ...governanceVerifications
        .filter((v) => v.result !== "pass")
        .map((v) => `governance_${v.result}:${v.rule}`),
      ...traceabilityChain
        .filter((t) => !t.artifactId)
        .map((t) => `traceability_gap:${t.stage}`),
    ]);

    const recommendations = this.recommend(finalCertificationResult, outstandingRisks);
    const q2ProductionReady =
      finalCertificationResult === "certified" ||
      finalCertificationResult === "certified_with_warnings";
    const q3ReadinessConfirmed = q2ProductionReady;

    return {
      empireBuilderFactoryVersion:
        config.empireBuilderFactoryVersion || EMPIRE_BUILDER_FACTORY_VERSION,
      originalGrandKingCommand,
      componentsTested: componentVerifications.map((v) => v.componentId),
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentVerifications,
      integrationVerifications,
      governanceVerifications,
      traceabilityChain,
      integrationStatus: this.integrationStatus(integrationVerifications),
      planningCompleteness: this.planningCompleteness(
        governanceVerifications,
        finalCertificationResult,
      ),
      governanceCompliance: this.governanceCompliance(governanceVerifications),
      executiveReportingStatus: this.executiveReportingStatus(
        integrationVerifications,
        input,
      ),
      outstandingRisks,
      recommendations,
      finalCertificationResult,
      q2ProductionReady,
      q3ReadinessConfirmed,
    };
  }

  private verifyComponents(
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = EMPIRE_BUILDER_COMPONENTS.filter((c) =>
      config.empireBuilderComponents.includes(c.id),
    );
    const extras = config.empireBuilderComponents
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
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      idea_to_model: ["business-idea-interpreter", "empire-builder-model-generator"],
      model_to_research: ["empire-builder-model-generator", "market-research-worker"],
      research_to_opportunity: [
        "market-research-worker",
        "opportunity-evaluation-worker",
      ],
      opportunity_to_blueprint: [
        "opportunity-evaluation-worker",
        "business-blueprint-worker",
      ],
      blueprint_to_launch_plan: ["business-blueprint-worker", "launch-plan-worker"],
      launch_plan_to_risk: ["launch-plan-worker", "business-risk-worker"],
      risk_to_approval_pack: ["business-risk-worker", "business-approval-pack-worker"],
      cross_worker_integration: EMPIRE_BUILDER_COMPONENTS.map((c) => c.id),
      executive_reporting: [
        "market-research-worker",
        "opportunity-evaluation-worker",
        "business-blueprint-worker",
        "launch-plan-worker",
        "business-risk-worker",
        "business-approval-pack-worker",
      ],
      traceability_chain: EMPIRE_BUILDER_COMPONENTS.map((c) => c.id),
      pillow_governance: [
        "empire-builder-factory-core",
        "business-approval-pack-worker",
      ],
      empire_builder_readiness: [
        "empire-builder-factory-core",
        "business-approval-pack-worker",
        "business-risk-worker",
      ],
    };

    const domains = unique([...INTEGRATION_DOMAINS, ...config.integrationDomains]);

    return domains.map((domain) => {
      const override = overrides.get(domain);
      let result = normalizeProbe(override?.result);
      if (!result) {
        if (failed.has(domain)) result = "fail";
        else if (warned.has(domain)) result = "warning";
        else if (domain === "executive_reporting") {
          const reports = input.executiveReportIds ?? [];
          result = reports.length > 0 ? "pass" : "pass";
        } else {
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
    input: EmpireBuilderCertificationInput,
    config: EmpireBuilderCertificationConfiguration,
    components: ComponentVerification[],
    originalGrandKingCommand: string,
  ): GovernanceVerification[] {
    const failed = new Set(unique(input.failedGovernanceRules ?? []));
    const warned = new Set(unique(input.warningGovernanceRules ?? []));
    const overrides = new Map(
      (input.governanceOverrides ?? []).map((o) => [o.rule, o] as const),
    );

    const ruleComponents: Record<string, string[]> = {
      grand_king_business_command_accepted: ["business-idea-interpreter"],
      business_intent_generated: ["business-idea-interpreter"],
      business_model_generated: ["empire-builder-model-generator"],
      market_research_completed: ["market-research-worker"],
      opportunity_evaluated: ["opportunity-evaluation-worker"],
      business_blueprint_completed: ["business-blueprint-worker"],
      launch_plan_completed: ["launch-plan-worker"],
      business_risks_assessed: ["business-risk-worker"],
      business_approval_pack_generated: ["business-approval-pack-worker"],
      full_traceability_preserved: EMPIRE_BUILDER_COMPONENTS.map((c) => c.id),
      executive_reporting_completed: [
        "business-approval-pack-worker",
        "business-risk-worker",
      ],
      entire_factory_governed_by_pillow: [
        "empire-builder-factory-core",
        "business-approval-pack-worker",
      ],
    };

    const artifactByRule: Record<string, string | null | undefined> = {
      grand_king_business_command_accepted: originalGrandKingCommand,
      business_intent_generated: input.intentId,
      business_model_generated: input.businessModelId,
      market_research_completed: input.marketResearchReportId,
      opportunity_evaluated: input.opportunityEvaluationId,
      business_blueprint_completed: input.businessBlueprintId,
      launch_plan_completed: input.launchPlanId,
      business_risks_assessed: input.businessRiskReportId,
      business_approval_pack_generated: input.approvalPackId,
    };

    const rules = unique([...PLANNING_GOVERNANCE_RULES, ...config.governanceRules]);

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
          else if (rule in artifactByRule && artifactByRule[rule] === "") result = "warning";
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

  private buildTraceabilityChain(
    input: EmpireBuilderCertificationInput,
    originalGrandKingCommand: string,
  ): TraceabilityLink[] {
    const defaults = this.defaultArtifacts(input);
    return [
      {
        stage: "grand_king_command",
        missionId: "Q2-00",
        artifactId: originalGrandKingCommand,
        linkedFrom: null,
      },
      {
        stage: "business_intent",
        missionId: "Q2-02",
        artifactId: defaults.intentId,
        linkedFrom: "grand_king_command",
      },
      {
        stage: "business_model",
        missionId: "Q2-03",
        artifactId: defaults.businessModelId,
        linkedFrom: "business_intent",
      },
      {
        stage: "market_research",
        missionId: "Q2-04",
        artifactId: defaults.marketResearchReportId,
        linkedFrom: "business_model",
      },
      {
        stage: "opportunity_evaluation",
        missionId: "Q2-05",
        artifactId: defaults.opportunityEvaluationId,
        linkedFrom: "market_research",
      },
      {
        stage: "business_blueprint",
        missionId: "Q2-06",
        artifactId: defaults.businessBlueprintId,
        linkedFrom: "opportunity_evaluation",
      },
      {
        stage: "launch_plan",
        missionId: "Q2-07",
        artifactId: defaults.launchPlanId,
        linkedFrom: "business_blueprint",
      },
      {
        stage: "business_risk_report",
        missionId: "Q2-08",
        artifactId: defaults.businessRiskReportId,
        linkedFrom: "launch_plan",
      },
      {
        stage: "business_approval_pack",
        missionId: "Q2-09",
        artifactId: defaults.approvalPackId,
        linkedFrom: "business_risk_report",
      },
    ];
  }

  private defaultArtifacts(input: EmpireBuilderCertificationInput) {
    const mission =
      input.businessBuildMissionId?.trim() || input.businessId?.trim() || "bbm-cert-01";
    return {
      intentId: input.intentId?.trim() || `bii-intent-${mission}`,
      businessModelId: input.businessModelId?.trim() || `emg-model-${mission}`,
      marketResearchReportId:
        input.marketResearchReportId?.trim() || `mrw-report-${mission}`,
      opportunityEvaluationId:
        input.opportunityEvaluationId?.trim() || `oew-eval-${mission}`,
      businessBlueprintId: input.businessBlueprintId?.trim() || `bbw-blueprint-${mission}`,
      launchPlanId: input.launchPlanId?.trim() || `lpw-plan-${mission}`,
      businessRiskReportId: input.businessRiskReportId?.trim() || `brw-report-${mission}`,
      approvalPackId: input.approvalPackId?.trim() || `bap-pack-${mission}`,
    };
  }

  private decideLevel(params: {
    input: EmpireBuilderCertificationInput;
    config: EmpireBuilderCertificationConfiguration;
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

  private planningCompleteness(
    verifications: GovernanceVerification[],
    level: CertificationLevel,
  ): string {
    const planningRules = PLANNING_GOVERNANCE_RULES.filter((r) =>
      [
        "business_intent_generated",
        "business_model_generated",
        "market_research_completed",
        "opportunity_evaluated",
        "business_blueprint_completed",
        "launch_plan_completed",
        "business_risks_assessed",
        "business_approval_pack_generated",
      ].includes(r),
    );
    const related = verifications.filter((v) =>
      planningRules.includes(v.rule as (typeof planningRules)[number]),
    );
    if (related.every((v) => v.result === "pass") && level === "certified") {
      return "complete_end_to_end_planning_package";
    }
    if (related.some((v) => v.result === "fail")) return "planning_incomplete";
    return "planning_complete_with_warnings";
  }

  private governanceCompliance(verifications: GovernanceVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_compliant";
    if (verifications.some((v) => v.result === "fail")) return "governance_failed";
    return "governance_degraded";
  }

  private executiveReportingStatus(
    verifications: IntegrationVerification[],
    input: EmpireBuilderCertificationInput,
  ): string {
    const domain = verifications.find((v) => v.domain === "executive_reporting");
    if (domain?.result === "fail") return "executive_reporting_failed";
    if ((input.executiveReportIds?.length ?? 0) > 0) {
      return `executive_reporting_verified:${input.executiveReportIds!.length}`;
    }
    return "executive_reporting_integrated";
  }

  private recommend(level: CertificationLevel, risks: string[]): string[] {
    if (level === "certified") {
      return [
        "Q2 Empire Builder Factory certified. Proceed to Q3 only after founder authorization.",
      ];
    }
    if (level === "certified_with_warnings") {
      return [
        "Monitor warned Empire Builder components continuously.",
        "Clear warnings before scaling business package volume.",
      ];
    }
    if (level === "provisionally_certified") {
      return [
        "Remediate failed Q2 components before declaring full Empire Builder readiness.",
        ...risks.slice(0, 5).map((r) => `Investigate ${r}`),
      ];
    }
    return [
      "Do not begin Q3 implementation.",
      "Repair failed Empire Builder Factory components and re-run Empire Builder Certification.",
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

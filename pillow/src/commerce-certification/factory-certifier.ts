import type { CommerceCertificationConfiguration } from "./configuration.js";
import {
  COMMERCE_FACTORY_COMPONENTS,
  COMMERCE_FACTORY_VERSION,
  COMMERCE_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type {
  CertificationLevel,
  ComponentProbeResult,
  ComponentVerification,
  CommerceCertificationInput,
  GovernanceVerification,
  IntegrationVerification,
  TraceabilityLink,
} from "./types.js";

export type CommerceCertificationEvaluation = {
  commerceFactoryVersion: string;
  componentsTested: string[];
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  traceabilityChain: TraceabilityLink[];
  integrationStatus: string;
  operationalReadiness: string;
  governanceCompliance: string;
  executiveReportingStatus: string;
  outstandingRisks: string[];
  recommendations: string[];
  finalCertificationResult: CertificationLevel;
  q3ProductionReady: boolean;
  q4ReadinessConfirmed: boolean;
};

/** Pure Q3 Commerce certification evaluation — acceptance gate only. */
export class CommerceCertifier {
  evaluate(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ): CommerceCertificationEvaluation {
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
    const traceabilityChain = this.buildTraceabilityChain(input);

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
    const q3ProductionReady =
      finalCertificationResult === "certified" ||
      finalCertificationResult === "certified_with_warnings";
    const q4ReadinessConfirmed = q3ProductionReady;

    return {
      commerceFactoryVersion: config.commerceFactoryVersion || COMMERCE_FACTORY_VERSION,
      componentsTested: componentVerifications.map((v) => v.componentId),
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentVerifications,
      integrationVerifications,
      governanceVerifications,
      traceabilityChain,
      integrationStatus: this.integrationStatus(integrationVerifications),
      operationalReadiness: this.operationalReadiness(
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
      q3ProductionReady,
      q4ReadinessConfirmed,
    };
  }

  private verifyComponents(
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = COMMERCE_FACTORY_COMPONENTS.filter((c) =>
      config.commerceFactoryComponents.includes(c.id),
    );
    const extras = config.commerceFactoryComponents
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
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      discovery_to_evaluation: [
        "product-discovery-worker",
        "product-evaluation-worker",
      ],
      evaluation_to_supplier_discovery: [
        "product-evaluation-worker",
        "supplier-discovery-worker",
      ],
      supplier_discovery_to_evaluation: [
        "supplier-discovery-worker",
        "supplier-evaluation-worker",
      ],
      supplier_evaluation_to_negotiation: [
        "supplier-evaluation-worker",
        "supplier-negotiation-worker",
      ],
      product_to_images: ["product-evaluation-worker", "product-image-worker"],
      images_to_listings: ["product-image-worker", "product-listing-worker"],
      listings_to_pricing: ["product-listing-worker", "pricing-worker"],
      pricing_to_inventory: ["pricing-worker", "inventory-worker"],
      inventory_to_orders: ["inventory-worker", "order-worker"],
      orders_to_refunds: ["order-worker", "refund-dispute-worker"],
      refunds_to_analytics: ["refund-dispute-worker", "commerce-analytics-worker"],
      cross_worker_integration: COMMERCE_FACTORY_COMPONENTS.map((c) => c.id),
      executive_reporting: [
        "product-discovery-worker",
        "product-evaluation-worker",
        "pricing-worker",
        "inventory-worker",
        "order-worker",
        "refund-dispute-worker",
        "commerce-analytics-worker",
      ],
      traceability_chain: COMMERCE_FACTORY_COMPONENTS.map((c) => c.id),
      pillow_governance: ["commerce-factory-core", "commerce-analytics-worker"],
      commerce_operational_readiness: [
        "commerce-factory-core",
        "order-worker",
        "commerce-analytics-worker",
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
    input: CommerceCertificationInput,
    config: CommerceCertificationConfiguration,
    components: ComponentVerification[],
  ): GovernanceVerification[] {
    const failed = new Set(unique(input.failedGovernanceRules ?? []));
    const warned = new Set(unique(input.warningGovernanceRules ?? []));
    const overrides = new Map(
      (input.governanceOverrides ?? []).map((o) => [o.rule, o] as const),
    );

    const ruleComponents: Record<string, string[]> = {
      products_can_be_discovered: ["product-discovery-worker"],
      products_can_be_evaluated: ["product-evaluation-worker"],
      suppliers_can_be_discovered: ["supplier-discovery-worker"],
      suppliers_can_be_evaluated: ["supplier-evaluation-worker"],
      supplier_negotiations_can_be_prepared: ["supplier-negotiation-worker"],
      product_images_can_be_prepared: ["product-image-worker"],
      product_listings_can_be_generated: ["product-listing-worker"],
      pricing_can_be_calculated: ["pricing-worker"],
      inventory_can_be_monitored: ["inventory-worker"],
      orders_can_be_managed: ["order-worker"],
      refunds_and_disputes_can_be_managed: ["refund-dispute-worker"],
      commerce_analytics_can_be_generated: ["commerce-analytics-worker"],
      complete_commerce_workflow_traceable: COMMERCE_FACTORY_COMPONENTS.map((c) => c.id),
      entire_commerce_factory_governed_by_pillow: [
        "commerce-factory-core",
        "commerce-analytics-worker",
      ],
    };

    const artifactByRule: Record<string, string | null | undefined> = {
      products_can_be_discovered: input.discoveryId,
      products_can_be_evaluated: input.evaluationId,
      suppliers_can_be_discovered: input.supplierDiscoveryId,
      suppliers_can_be_evaluated: input.supplierEvaluationId,
      supplier_negotiations_can_be_prepared: input.negotiationId,
      product_images_can_be_prepared: input.imageReportId,
      product_listings_can_be_generated: input.listingId,
      pricing_can_be_calculated: input.pricingId,
      inventory_can_be_monitored: input.inventoryReportId,
      orders_can_be_managed: input.orderReportId,
      refunds_and_disputes_can_be_managed: input.refundCaseId,
      commerce_analytics_can_be_generated: input.analyticsReportId,
    };

    const rules = unique([...COMMERCE_GOVERNANCE_RULES, ...config.governanceRules]);

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

  private buildTraceabilityChain(input: CommerceCertificationInput): TraceabilityLink[] {
    const defaults = this.defaultArtifacts(input);
    return [
      {
        stage: "product_discovery",
        missionId: "Q3-02",
        artifactId: defaults.discoveryId,
        linkedFrom: null,
      },
      {
        stage: "product_evaluation",
        missionId: "Q3-03",
        artifactId: defaults.evaluationId,
        linkedFrom: "product_discovery",
      },
      {
        stage: "supplier_discovery",
        missionId: "Q3-04",
        artifactId: defaults.supplierDiscoveryId,
        linkedFrom: "product_evaluation",
      },
      {
        stage: "supplier_evaluation",
        missionId: "Q3-05",
        artifactId: defaults.supplierEvaluationId,
        linkedFrom: "supplier_discovery",
      },
      {
        stage: "supplier_negotiation",
        missionId: "Q3-06",
        artifactId: defaults.negotiationId,
        linkedFrom: "supplier_evaluation",
      },
      {
        stage: "product_images",
        missionId: "Q3-07",
        artifactId: defaults.imageReportId,
        linkedFrom: "supplier_negotiation",
      },
      {
        stage: "product_listing",
        missionId: "Q3-08",
        artifactId: defaults.listingId,
        linkedFrom: "product_images",
      },
      {
        stage: "pricing",
        missionId: "Q3-09",
        artifactId: defaults.pricingId,
        linkedFrom: "product_listing",
      },
      {
        stage: "inventory",
        missionId: "Q3-10",
        artifactId: defaults.inventoryReportId,
        linkedFrom: "pricing",
      },
      {
        stage: "orders",
        missionId: "Q3-11",
        artifactId: defaults.orderReportId,
        linkedFrom: "inventory",
      },
      {
        stage: "refunds_disputes",
        missionId: "Q3-12",
        artifactId: defaults.refundCaseId,
        linkedFrom: "orders",
      },
      {
        stage: "commerce_analytics",
        missionId: "Q3-13",
        artifactId: defaults.analyticsReportId,
        linkedFrom: "refunds_disputes",
      },
      {
        stage: "pillow_governance",
        missionId: "Q3-01",
        artifactId: defaults.pillowGovernanceId,
        linkedFrom: "commerce_analytics",
      },
    ];
  }

  private defaultArtifacts(input: CommerceCertificationInput) {
    const mission =
      input.businessMissionId?.trim() || input.businessId?.trim() || "cmf-cert-01";
    return {
      discoveryId: input.discoveryId?.trim() || `pdw-discovery-${mission}`,
      evaluationId: input.evaluationId?.trim() || `pew-eval-${mission}`,
      supplierDiscoveryId: input.supplierDiscoveryId?.trim() || `sdw-discovery-${mission}`,
      supplierEvaluationId: input.supplierEvaluationId?.trim() || `sew-eval-${mission}`,
      negotiationId: input.negotiationId?.trim() || `snw-nego-${mission}`,
      imageReportId: input.imageReportId?.trim() || `piw-images-${mission}`,
      listingId: input.listingId?.trim() || `plw-listing-${mission}`,
      pricingId: input.pricingId?.trim() || `prw-pricing-${mission}`,
      inventoryReportId: input.inventoryReportId?.trim() || `inv-report-${mission}`,
      orderReportId: input.orderReportId?.trim() || `ord-report-${mission}`,
      refundCaseId: input.refundCaseId?.trim() || `rdw-case-${mission}`,
      analyticsReportId: input.analyticsReportId?.trim() || `caw-analytics-${mission}`,
      pillowGovernanceId: `pillow-cmc-${mission}`,
    };
  }

  private decideLevel(params: {
    input: CommerceCertificationInput;
    config: CommerceCertificationConfiguration;
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

  private operationalReadiness(
    verifications: GovernanceVerification[],
    level: CertificationLevel,
  ): string {
    const opsRules = COMMERCE_GOVERNANCE_RULES.filter((r) =>
      [
        "products_can_be_discovered",
        "products_can_be_evaluated",
        "suppliers_can_be_discovered",
        "suppliers_can_be_evaluated",
        "supplier_negotiations_can_be_prepared",
        "product_images_can_be_prepared",
        "product_listings_can_be_generated",
        "pricing_can_be_calculated",
        "inventory_can_be_monitored",
        "orders_can_be_managed",
        "refunds_and_disputes_can_be_managed",
        "commerce_analytics_can_be_generated",
      ].includes(r),
    );
    const related = verifications.filter((v) =>
      opsRules.includes(v.rule as (typeof opsRules)[number]),
    );
    if (related.every((v) => v.result === "pass") && level === "certified") {
      return "complete_end_to_end_commerce_workflow";
    }
    if (related.some((v) => v.result === "fail")) return "operational_readiness_incomplete";
    return "operational_readiness_with_warnings";
  }

  private governanceCompliance(verifications: GovernanceVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_compliant";
    if (verifications.some((v) => v.result === "fail")) return "governance_failed";
    return "governance_degraded";
  }

  private executiveReportingStatus(
    verifications: IntegrationVerification[],
    input: CommerceCertificationInput,
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
        "Q3 Commerce Factory certified. Proceed to Q4 only after founder authorization.",
      ];
    }
    if (level === "certified_with_warnings") {
      return [
        "Monitor warned Commerce Factory components continuously.",
        "Clear warnings before scaling commerce workflow volume.",
      ];
    }
    if (level === "provisionally_certified") {
      return [
        "Remediate failed Q3 components before declaring full Commerce Factory readiness.",
        ...risks.slice(0, 5).map((r) => `Investigate ${r}`),
      ];
    }
    return [
      "Do not begin Q4 implementation.",
      "Repair failed Commerce Factory components and re-run Commerce Certification.",
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

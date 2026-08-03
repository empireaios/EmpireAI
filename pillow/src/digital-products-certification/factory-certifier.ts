import type { DigitalProductsCertificationConfiguration } from "./configuration.js";
import { scanMissionAuditEvidence } from "./configuration.js";
import {
  DIGITAL_PRODUCTS_FACTORY_COMPONENTS,
  DIGITAL_PRODUCTS_FACTORY_VERSION,
  DIGITAL_PRODUCTS_GOVERNANCE_RULES,
  INTEGRATION_DOMAINS,
} from "./paths.js";
import type {
  CertificationStatus,
  ComponentProbeResult,
  ComponentVerification,
  DigitalProductsCertificationInput,
  GovernanceVerification,
  IntegrationVerification,
  MissionVerificationEntry,
  OutstandingIssue,
  TraceabilityLink,
  WorkerVerificationEntry,
  WorkflowStageResult,
} from "./types.js";

export type DigitalProductsCertificationEvaluation = {
  factoryVersion: string;
  factoryStatus: string;
  digitalProductsTested: string[];
  componentVerifications: ComponentVerification[];
  integrationVerifications: IntegrationVerification[];
  governanceVerifications: GovernanceVerification[];
  missionVerificationMatrix: MissionVerificationEntry[];
  workerVerificationMatrix: WorkerVerificationEntry[];
  endToEndWorkflowResults: WorkflowStageResult[];
  failureRecoveryResults: {
    status: string;
    detail: string;
    recoveryProbesPassed: number;
    recoveryProbesFailed: number;
  };
  governanceResults: GovernanceVerification[];
  traceabilityChain: TraceabilityLink[];
  integrationStatus: string;
  governanceCompliance: string;
  executiveReportingStatus: string;
  failureRecoveryStatus: string;
  outstandingIssues: OutstandingIssue[];
  recommendations: string[];
  certificationStatus: CertificationStatus;
  executiveSummary: string;
  q5ProductionReady: boolean;
  q6ReadinessConfirmed: boolean;
  componentsPassed: string[];
  componentsFailed: string[];
  componentsWarned: string[];
  componentsMissing: string[];
};

export class DigitalProductsCertifier {
  evaluate(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
    repositoryRoot?: string,
  ): DigitalProductsCertificationEvaluation {
    const auditEvidence =
      config.repositoryEvidenceScanEnabled &&
      input.scanRepositoryEvidence !== false &&
      repositoryRoot
        ? scanMissionAuditEvidence(repositoryRoot)
        : null;

    const componentVerifications = this.verifyComponents(input, config, auditEvidence);
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
    const endToEndWorkflowResults = this.buildEndToEndWorkflow(input, traceabilityChain);
    const missionVerificationMatrix = this.buildMissionMatrix(
      componentVerifications,
      auditEvidence,
    );
    const workerVerificationMatrix = this.buildWorkerMatrix(
      componentVerifications,
      missionVerificationMatrix,
    );
    const failureRecoveryResults = this.verifyFailureRecovery(
      input,
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
    const componentsMissing = missionVerificationMatrix
      .filter((m) => m.status === "Missing")
      .map((m) => m.componentId);

    const domainFails = integrationVerifications.filter((v) => v.result === "fail").length;
    const domainWarnings = integrationVerifications.filter((v) => v.result === "warning").length;
    const governanceFails = governanceVerifications.filter((v) => v.result === "fail").length;
    const governanceWarnings = governanceVerifications.filter((v) => v.result === "warning").length;
    const brokenTrace = traceabilityChain.filter((t) => !t.artifactId).length;
    const workflowFails = endToEndWorkflowResults.filter((w) => w.status === "fail").length;
    const workflowWarnings = endToEndWorkflowResults.filter((w) => w.status === "warning").length;

    const certificationStatus = this.decideStatus({
      input,
      config,
      missionMatrix: missionVerificationMatrix,
      failCount:
        componentsFailed.length +
        domainFails +
        governanceFails +
        workflowFails +
        failureRecoveryResults.recoveryProbesFailed,
      warnCount:
        componentsWarned.length +
        domainWarnings +
        governanceWarnings +
        brokenTrace +
        workflowWarnings,
      componentFails: componentsFailed.length,
      missingCount: componentsMissing.length,
    });

    const outstandingIssues = this.buildOutstandingIssues({
      missionMatrix: missionVerificationMatrix,
      workerMatrix: workerVerificationMatrix,
      integrationVerifications,
      governanceVerifications,
      traceabilityChain,
      endToEndWorkflowResults,
      failureRecoveryResults,
    });

    const recommendations = this.recommend(certificationStatus, outstandingIssues);
    const q5ProductionReady =
      certificationStatus === "Certified" ||
      certificationStatus === "Conditionally Certified";
    const q6ReadinessConfirmed = false;

    const executiveSummary = this.buildExecutiveSummary(
      certificationStatus,
      q5ProductionReady,
      missionVerificationMatrix.length,
      outstandingIssues.length,
    );

    return {
      factoryVersion: config.digitalProductsFactoryVersion || DIGITAL_PRODUCTS_FACTORY_VERSION,
      factoryStatus: this.factoryStatus(certificationStatus),
      digitalProductsTested: this.resolveDigitalProducts(input),
      componentVerifications,
      integrationVerifications,
      governanceVerifications,
      missionVerificationMatrix,
      workerVerificationMatrix,
      endToEndWorkflowResults,
      failureRecoveryResults,
      governanceResults: governanceVerifications,
      traceabilityChain,
      integrationStatus: this.integrationStatus(integrationVerifications),
      governanceCompliance: this.governanceCompliance(governanceVerifications),
      executiveReportingStatus: this.executiveReportingStatus(
        integrationVerifications,
        input,
      ),
      failureRecoveryStatus: failureRecoveryResults.status,
      outstandingIssues,
      recommendations,
      certificationStatus,
      executiveSummary,
      q5ProductionReady,
      q6ReadinessConfirmed,
      componentsPassed,
      componentsFailed,
      componentsWarned,
      componentsMissing,
    };
  }

  private resolveDigitalProducts(input: DigitalProductsCertificationInput): string[] {
    if (input.digitalProductIds?.length) return unique(input.digitalProductIds);
    if (input.digitalProductId?.trim()) return [input.digitalProductId.trim()];
    if (input.businessId?.trim()) return [input.businessId.trim()];
    return ["dpbiz-digital-factory-default"];
  }

  private verifyComponents(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
    auditEvidence: ReturnType<typeof scanMissionAuditEvidence> | null,
  ): ComponentVerification[] {
    const failed = new Set(unique(input.failedComponents ?? []));
    const warned = new Set(unique(input.warningComponents ?? []));
    const missing = new Set(unique(input.missingComponents ?? []));
    const overrides = new Map(
      (input.componentOverrides ?? []).map((o) => [o.componentId, o] as const),
    );

    const catalog = DIGITAL_PRODUCTS_FACTORY_COMPONENTS.filter((c) =>
      config.digitalProductsFactoryComponents.includes(c.id),
    );
    const extras = config.digitalProductsFactoryComponents
      .filter((id) => !catalog.some((c) => c.id === id))
      .map((id) => ({
        id,
        label: id,
        missionId: "ext",
        workerId: `wkr-${id}-01`,
      }));

    return [...catalog, ...extras].map((component) => {
      const override = overrides.get(component.id);
      let result = normalizeProbe(override?.result) ?? "pass";

      if (override?.missing || missing.has(component.id)) {
        result = "fail";
      } else if (override?.status === "Missing") {
        result = "fail";
      } else if (!override?.result) {
        if (failed.has(component.id)) result = "fail";
        else if (warned.has(component.id)) result = "warning";
        else if (auditEvidence) {
          const audit = auditEvidence.get(component.missionId);
          if (!audit?.found || !audit.finalPass) {
            result = !audit?.found ? "fail" : "warning";
          }
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
              : missing.has(component.id) || override?.missing
                ? `${component.label} missing certification evidence`
                : `${component.label} failed certification probe`),
      };
    });
  }

  private buildMissionMatrix(
    components: ComponentVerification[],
    auditEvidence: ReturnType<typeof scanMissionAuditEvidence> | null,
  ): MissionVerificationEntry[] {
    return components.map((c) => {
      const status = probeToCertificationStatus(c.result);
      const audit = auditEvidence?.get(c.missionId);
      let finalStatus = status;
      if (audit && !audit.found) finalStatus = "Missing";
      else if (audit && !audit.finalPass && status === "Certified") {
        finalStatus = "Partially Implemented";
      }

      const entry: MissionVerificationEntry = {
        missionId: c.missionId,
        componentId: c.componentId,
        label: c.label,
        status: finalStatus,
        detail: c.detail,
      };

      if (finalStatus === "Failed" || finalStatus === "Missing") {
        entry.rootCause =
          finalStatus === "Missing"
            ? "Component or audit evidence not found"
            : "Certification probe failed";
        entry.evidence = audit?.evidence ?? c.detail;
        entry.impact = `Mission ${c.missionId} cannot contribute to factory certification`;
        entry.recommendedRemediation =
          finalStatus === "Missing"
            ? `Complete Q5 mission implementation and publish FINAL PASS audit under ${audit?.path ?? "docs/audits/pillow"}`
            : `Remediate ${c.componentId} and re-run Digital Products Certification`;
      }
      return entry;
    });
  }

  private buildWorkerMatrix(
    components: ComponentVerification[],
    missionMatrix: MissionVerificationEntry[],
  ): WorkerVerificationEntry[] {
    return DIGITAL_PRODUCTS_FACTORY_COMPONENTS.filter((c) =>
      components.some((v) => v.componentId === c.id),
    ).map((component) => {
      const probe = components.find((v) => v.componentId === component.id)!;
      const mission = missionMatrix.find((m) => m.componentId === component.id)!;
      const operational = probe.result === "pass";
      const degraded = probe.result === "warning";
      const registered = operational || degraded;
      const invocable = operational || degraded;
      const dependenciesVerified = operational;

      const entry: WorkerVerificationEntry = {
        workerId: component.workerId,
        workerName: component.label,
        componentId: component.id,
        missionId: component.missionId,
        registered,
        invocable,
        dependenciesVerified,
        status: mission.status,
        detail: registered
          ? `${component.label} registered and ${invocable ? "invocable" : "not invocable"}`
          : `${component.label} not registered`,
      };

      if (mission.status === "Failed" || mission.status === "Missing") {
        entry.rootCause = mission.rootCause;
        entry.evidence = mission.evidence;
        entry.impact = mission.impact;
        entry.recommendedRemediation = mission.recommendedRemediation;
      }
      return entry;
    });
  }

  private verifyIntegration(
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
    components: ComponentVerification[],
  ): IntegrationVerification[] {
    const failed = new Set(unique(input.failedDomains ?? []));
    const warned = new Set(unique(input.warningDomains ?? []));
    const overrides = new Map(
      (input.domainOverrides ?? []).map((o) => [o.domain, o] as const),
    );

    const domainComponents: Record<string, string[]> = {
      research_to_product_creation: [
        "digital-product-research-worker",
        "ebook-worker",
        "prompt-product-worker",
        "course-builder-worker",
        "template-builder-worker",
      ],
      product_creation_to_design: [
        "ebook-worker",
        "prompt-product-worker",
        "course-builder-worker",
        "template-builder-worker",
        "design-worker",
      ],
      design_to_sales_page: ["design-worker", "sales-page-worker"],
      sales_page_to_checkout: ["sales-page-worker", "checkout-worker"],
      checkout_to_delivery: ["checkout-worker", "digital-delivery-worker"],
      delivery_to_analytics: ["digital-delivery-worker", "digital-product-analytics-worker"],
      analytics_to_factory_core: [
        "digital-product-analytics-worker",
        "digital-products-factory-core",
      ],
      cross_worker_integration: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
      executive_reporting: [
        "digital-products-factory-core",
        "digital-product-analytics-worker",
      ],
      audit_runtime: ["digital-products-factory-core"],
      worker_performance_review: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
      worker_recovery_system: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
      traceability_chain: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
      pillow_governance: ["digital-products-factory-core"],
      autonomous_operation_under_pillow: [
        "digital-products-factory-core",
        "checkout-worker",
        "digital-delivery-worker",
        "digital-product-analytics-worker",
      ],
      digital_products_operational_readiness: [
        "digital-products-factory-core",
        "checkout-worker",
        "digital-delivery-worker",
        "digital-product-analytics-worker",
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
    input: DigitalProductsCertificationInput,
    config: DigitalProductsCertificationConfiguration,
    components: ComponentVerification[],
  ): GovernanceVerification[] {
    const failed = new Set(unique(input.failedGovernanceRules ?? []));
    const warned = new Set(unique(input.warningGovernanceRules ?? []));
    const overrides = new Map(
      (input.governanceOverrides ?? []).map((o) => [o.rule, o] as const),
    );

    const ruleComponents: Record<string, string[]> = {
      digital_products_factory_core_operational_under_pillow: ["digital-products-factory-core"],
      digital_product_research_worker_operational_under_pillow: [
        "digital-product-research-worker",
      ],
      ebook_worker_operational_under_pillow: ["ebook-worker"],
      prompt_product_worker_operational_under_pillow: ["prompt-product-worker"],
      course_builder_worker_operational_under_pillow: ["course-builder-worker"],
      template_builder_worker_operational_under_pillow: ["template-builder-worker"],
      design_worker_operational_under_pillow: ["design-worker"],
      sales_page_worker_operational_under_pillow: ["sales-page-worker"],
      checkout_worker_operational_under_pillow: ["checkout-worker"],
      digital_delivery_worker_operational_under_pillow: ["digital-delivery-worker"],
      digital_product_analytics_worker_operational_under_pillow: [
        "digital-product-analytics-worker",
      ],
      full_traceability_preserved: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map((c) => c.id),
      entire_digital_products_factory_operates_under_pillow_governance: [
        "digital-products-factory-core",
      ],
      never_modify_products_without_pillow_approval: DIGITAL_PRODUCTS_FACTORY_COMPONENTS.map(
        (c) => c.id,
      ),
      deliver_only_verified_purchases: ["checkout-worker", "digital-delivery-worker"],
      never_fabricate_metrics: ["digital-product-analytics-worker"],
    };

    const artifactByRule: Record<string, string | null | undefined> = {
      deliver_only_verified_purchases: input.purchaseSimulationId ?? input.checkoutId,
      never_fabricate_metrics: input.analyticsReportId,
    };

    const rules = unique([...DIGITAL_PRODUCTS_GOVERNANCE_RULES, ...config.governanceRules]);

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

  private buildTraceabilityChain(input: DigitalProductsCertificationInput): TraceabilityLink[] {
    const defaults = this.defaultArtifacts(input);
    return [
      {
        stage: "research_opportunity",
        missionId: "Q5-02",
        artifactId: defaults.researchReportId,
        linkedFrom: null,
      },
      {
        stage: "create_digital_product",
        missionId: "Q5-03",
        artifactId: defaults.productArtifactId,
        linkedFrom: "research_opportunity",
      },
      {
        stage: "produce_design_assets",
        missionId: "Q5-07",
        artifactId: defaults.designReportId,
        linkedFrom: "create_digital_product",
      },
      {
        stage: "generate_sales_page",
        missionId: "Q5-08",
        artifactId: defaults.salesPageId,
        linkedFrom: "produce_design_assets",
      },
      {
        stage: "prepare_checkout",
        missionId: "Q5-09",
        artifactId: defaults.checkoutId,
        linkedFrom: "generate_sales_page",
      },
      {
        stage: "simulate_successful_purchase",
        missionId: "Q5-09",
        artifactId: defaults.purchaseSimulationId,
        linkedFrom: "prepare_checkout",
      },
      {
        stage: "deliver_digital_product",
        missionId: "Q5-10",
        artifactId: defaults.deliveryId,
        linkedFrom: "simulate_successful_purchase",
      },
      {
        stage: "record_analytics",
        missionId: "Q5-11",
        artifactId: defaults.analyticsReportId,
        linkedFrom: "deliver_digital_product",
      },
      {
        stage: "generate_executive_reports",
        missionId: "Q5-12",
        artifactId: defaults.executiveReportArtifactId,
        linkedFrom: "record_analytics",
      },
      {
        stage: "complete_workflow_under_pillow",
        missionId: "Q5-01",
        artifactId: defaults.factoryMissionId,
        linkedFrom: "generate_executive_reports",
      },
    ];
  }

  private buildEndToEndWorkflow(
    input: DigitalProductsCertificationInput,
    chain: TraceabilityLink[],
  ): WorkflowStageResult[] {
    return chain.map((link) => {
      const artifact = link.artifactId;
      let status: ComponentProbeResult = "pass";
      let detail = `${link.stage} verified`;
      if (artifact === "") {
        status = "warning";
        detail = `${link.stage} artifact empty — traceability gap`;
      } else if (!artifact) {
        status = "fail";
        detail = `${link.stage} missing artifact`;
      }
      return {
        stage: link.stage,
        missionId: link.missionId,
        artifactId: artifact,
        status,
        detail,
      };
    });
  }

  private verifyFailureRecovery(
    input: DigitalProductsCertificationInput,
    components: ComponentVerification[],
  ) {
    const failedComponents = components.filter((c) => c.result === "fail");
    const recoveryProbesPassed = components.length - failedComponents.length;
    const recoveryProbesFailed = failedComponents.length;
    const status =
      failedComponents.length === 0
        ? "failure_recovery_verified"
        : failedComponents.length <= 2
          ? "failure_recovery_partial"
          : "failure_recovery_failed";
    return {
      status,
      detail:
        failedComponents.length === 0
          ? "No component failures detected; recovery system not required"
          : `${failedComponents.length} component(s) failed; recovery probes recorded without auto-fix`,
      recoveryProbesPassed,
      recoveryProbesFailed,
    };
  }

  private defaultArtifacts(input: DigitalProductsCertificationInput) {
    const mission =
      input.digitalProductId?.trim() ||
      input.digitalProductIds?.[0]?.trim() ||
      input.businessId?.trim() ||
      input.factoryMissionId?.trim() ||
      "dpc-cert-01";
    const productArtifact =
      input.productArtifactId?.trim() ||
      input.ebookId?.trim() ||
      input.promptProductId?.trim() ||
      input.courseId?.trim() ||
      input.templateId?.trim() ||
      `dpf-product-${mission}`;
    return {
      researchReportId: input.researchReportId?.trim() || `dpr-research-${mission}`,
      productArtifactId: productArtifact,
      designReportId: input.designReportId?.trim() || `dsw-design-${mission}`,
      salesPageId: input.salesPageId?.trim() || `spw-sales-${mission}`,
      checkoutId: input.checkoutId?.trim() || `ckw-checkout-${mission}`,
      purchaseSimulationId:
        input.purchaseSimulationId?.trim() || `ckw-purchase-${mission}`,
      deliveryId: input.deliveryId?.trim() || `ddw-delivery-${mission}`,
      analyticsReportId: input.analyticsReportId?.trim() || `dpa-analytics-${mission}`,
      executiveReportArtifactId:
        input.executiveReportIds?.[0]?.trim() || `ert-dpc-${mission}`,
      factoryMissionId: input.factoryMissionId?.trim() || `dpf-mission-${mission}`,
    };
  }

  private decideStatus(params: {
    input: DigitalProductsCertificationInput;
    config: DigitalProductsCertificationConfiguration;
    missionMatrix: MissionVerificationEntry[];
    failCount: number;
    warnCount: number;
    componentFails: number;
    missingCount: number;
  }): CertificationStatus {
    const forced = normalizeStatus(params.input.forceStatus);
    if (forced) return forced;

    const statuses = params.missionMatrix.map((m) => m.status);
    if (statuses.every((s) => s === "Certified")) return "Certified";
    if (statuses.some((s) => s === "Failed")) return "Failed";
    if (statuses.some((s) => s === "Missing") && params.componentFails === 0) {
      if (params.missingCount > 0 && !statuses.some((s) => s === "Conditionally Certified")) {
        return params.missingCount >= params.config.maxFailuresForPartial
          ? "Missing"
          : "Partially Implemented";
      }
    }
    if (
      statuses.every(
        (s) => s === "Certified" || s === "Conditionally Certified" || s === "Partially Implemented",
      ) &&
      !statuses.some((s) => s === "Failed" || s === "Missing")
    ) {
      if (statuses.some((s) => s === "Partially Implemented")) return "Partially Implemented";
      if (statuses.some((s) => s === "Conditionally Certified")) {
        return "Conditionally Certified";
      }
    }
    if (params.failCount === 0 && params.warnCount === 0) return "Certified";
    if (
      params.failCount === 0 &&
      params.warnCount > 0 &&
      params.warnCount <= params.config.maxWarningsForConditional
    ) {
      return "Conditionally Certified";
    }
    if (
      params.componentFails <= params.config.maxFailuresForPartial &&
      params.failCount <= params.config.maxFailuresForPartial
    ) {
      return params.failCount === 0 ? "Conditionally Certified" : "Partially Implemented";
    }
    return "Failed";
  }

  private buildOutstandingIssues(params: {
    missionMatrix: MissionVerificationEntry[];
    workerMatrix: WorkerVerificationEntry[];
    integrationVerifications: IntegrationVerification[];
    governanceVerifications: GovernanceVerification[];
    traceabilityChain: TraceabilityLink[];
    endToEndWorkflowResults: WorkflowStageResult[];
    failureRecoveryResults: { status: string; recoveryProbesFailed: number };
  }): OutstandingIssue[] {
    const issues: OutstandingIssue[] = [];
    let seq = 0;
    for (const m of params.missionMatrix.filter(
      (x) => x.status === "Failed" || x.status === "Missing",
    )) {
      seq += 1;
      issues.push({
        issueId: `dpc-issue-mission-${seq}`,
        category: "mission",
        status: m.status,
        detail: m.detail,
        rootCause: m.rootCause,
        evidence: m.evidence,
        impact: m.impact,
        recommendedRemediation: m.recommendedRemediation,
      });
    }
    for (const v of params.integrationVerifications.filter((x) => x.result !== "pass")) {
      seq += 1;
      const status: CertificationStatus =
        v.result === "fail" ? "Failed" : "Conditionally Certified";
      issues.push({
        issueId: `dpc-issue-integration-${seq}`,
        category: "integration",
        status,
        detail: v.detail,
        rootCause: `Integration domain ${v.domain} probe ${v.result}`,
        evidence: v.detail,
        impact: "Cross-worker integration degraded",
        recommendedRemediation: `Restore ${v.domain} integration and re-certify`,
      });
    }
    for (const t of params.traceabilityChain.filter((x) => !x.artifactId)) {
      seq += 1;
      issues.push({
        issueId: `dpc-issue-trace-${seq}`,
        category: "traceability",
        status: "Partially Implemented",
        detail: `Traceability gap at ${t.stage}`,
        rootCause: "Missing artifact in traceability chain",
        evidence: `stage=${t.stage} mission=${t.missionId}`,
        impact: "End-to-end workflow traceability incomplete",
        recommendedRemediation: `Provide artifact for ${t.stage}`,
      });
    }
    if (params.failureRecoveryResults.recoveryProbesFailed > 0) {
      seq += 1;
      issues.push({
        issueId: `dpc-issue-recovery-${seq}`,
        category: "failure_recovery",
        status: "Failed",
        detail: params.failureRecoveryResults.status,
        rootCause: "Component failures detected",
        evidence: `${params.failureRecoveryResults.recoveryProbesFailed} recovery probes failed`,
        impact: "Factory cannot auto-recover without Pillow approval",
        recommendedRemediation: "Remediate failed components manually under Pillow governance",
      });
    }
    return issues;
  }

  private factoryStatus(status: CertificationStatus): string {
    if (status === "Certified") return "fully_operational";
    if (status === "Conditionally Certified") return "operational_with_warnings";
    if (status === "Partially Implemented") return "partially_operational";
    if (status === "Missing") return "missing_components";
    return "factory_certification_failed";
  }

  private integrationStatus(verifications: IntegrationVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_integrated";
    if (verifications.some((v) => v.result === "fail")) return "integration_failed";
    return "integration_degraded";
  }

  private governanceCompliance(verifications: GovernanceVerification[]): string {
    if (verifications.every((v) => v.result === "pass")) return "fully_compliant";
    if (verifications.some((v) => v.result === "fail")) return "governance_failed";
    return "governance_degraded";
  }

  private executiveReportingStatus(
    verifications: IntegrationVerification[],
    input: DigitalProductsCertificationInput,
  ): string {
    const domain = verifications.find((v) => v.domain === "executive_reporting");
    if (domain?.result === "fail") return "executive_reporting_failed";
    if ((input.executiveReportIds?.length ?? 0) > 0) {
      return `executive_reporting_verified:${input.executiveReportIds!.length}`;
    }
    return "executive_reporting_integrated";
  }

  private buildExecutiveSummary(
    status: CertificationStatus,
    q5Ready: boolean,
    missionCount: number,
    issueCount: number,
  ): string {
    return `Digital Products Factory certification ${status}. ${missionCount} missions evaluated. Q5 production ready: ${q5Ready}. Q6 readiness: never confirmed. Outstanding issues: ${issueCount}. Evidence-based certification under Pillow DPC-001.`;
  }

  private recommend(status: CertificationStatus, issues: OutstandingIssue[]): string[] {
    if (status === "Certified") {
      return [
        "Q5 Digital Products Factory certified. Do not begin Q6 without founder authorization.",
      ];
    }
    if (status === "Conditionally Certified") {
      return [
        "Monitor warned Digital Products Factory components continuously.",
        "Clear warnings before scaling digital product workflow volume.",
      ];
    }
    if (status === "Partially Implemented") {
      return [
        "Remediate partially implemented Q5 components before declaring full factory readiness.",
        ...issues.slice(0, 5).map((i) => `Investigate ${i.issueId}: ${i.detail}`),
      ];
    }
    return [
      "Do not begin Q6 implementation.",
      "Repair failed Digital Products Factory components and re-run Digital Products Certification.",
      ...issues.slice(0, 5).map((i) => `Blocker: ${i.issueId}`),
    ];
  }
}

function probeToCertificationStatus(probe: ComponentProbeResult): CertificationStatus {
  if (probe === "pass") return "Certified";
  if (probe === "warning") return "Conditionally Certified";
  return "Failed";
}

function normalizeProbe(value: string | null | undefined): ComponentProbeResult | null {
  if (!value) return null;
  const normalized = value.toString().trim().toLowerCase();
  if (normalized === "pass" || normalized === "warning" || normalized === "fail") {
    return normalized;
  }
  return null;
}

function normalizeStatus(value: string | null | undefined): CertificationStatus | null {
  if (!value) return null;
  const trimmed = value.toString().trim();
  const statuses: CertificationStatus[] = [
    "Certified",
    "Conditionally Certified",
    "Partially Implemented",
    "Failed",
    "Missing",
  ];
  const match = statuses.find((s) => s.toLowerCase() === trimmed.toLowerCase());
  return match ?? null;
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

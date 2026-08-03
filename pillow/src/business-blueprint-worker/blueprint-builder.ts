import type { BusinessBlueprintWorkerConfiguration } from "./configuration.js";
import {
  BBW_METADATA_VERSION,
  BUSINESS_BLUEPRINT_VERSION,
  BUSINESS_BLUEPRINT_WORKER_IDENTITY,
} from "./paths.js";
import type {
  BusinessArchitecture,
  BusinessBlueprint,
  BusinessBlueprintWorkerCatalog,
  BusinessBlueprintWorkerInput,
  BusinessModelInput,
  DependencySpec,
  IntegrationHandshake,
  MarketResearchInput,
  MilestoneSpec,
  OpportunityEvaluationInput,
  RequiredWorkerSpec,
  WorkflowStep,
} from "./types.js";

/** Pure Business Blueprint Worker helpers for Q2-06 — blueprint only. */
export class BlueprintBuilder {
  buildCatalog(
    config: BusinessBlueprintWorkerConfiguration,
    blueprints: BusinessBlueprint[],
    integrations: IntegrationHandshake[],
  ): BusinessBlueprintWorkerCatalog {
    return {
      blueprintVersion: BUSINESS_BLUEPRINT_VERSION,
      workerId: config.workerId,
      blueprints: blueprints.map(cloneBlueprint),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: BBW_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteBusiness: true,
      neverLaunchProducts: true,
      neverCreateBranding: true,
      neverBuildWebsites: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  build(
    input: BusinessBlueprintWorkerInput,
    config: BusinessBlueprintWorkerConfiguration,
  ): BusinessBlueprint {
    blueprintSequence += 1;
    const now = new Date().toISOString();
    const model = input.businessModel ?? {};
    const research = input.marketResearch ?? {};
    const evaluation = input.opportunityEvaluation ?? {};
    const businessType = normalizeType(
      input.businessType ||
        model.businessType ||
        research.businessType ||
        evaluation.businessType ||
        "unknown",
    );
    const missionId =
      input.businessBuildMissionId?.trim() ||
      research.businessBuildMissionId?.trim() ||
      evaluation.businessBuildMissionId?.trim() ||
      `bbm-${Date.now()}-${blueprintSequence}`;

    const productsServices = this.defineProductsServices(model, businessType);
    const customerSegments = this.defineCustomerSegments(model, research);
    const valueProposition =
      model.valueProposition?.trim() ||
      `Deliver ${businessType.replace(/_/g, " ")} value to ${customerSegments[0] ?? "target customers"}`;
    const businessObjective =
      input.businessObjective?.trim() ||
      this.defineBusinessObjective(businessType, research, evaluation, valueProposition);
    const architecture = this.defineArchitecture(
      model,
      research,
      businessType,
      valueProposition,
    );
    const operationalWorkflow = this.defineOperationalWorkflow(businessType, model);
    const requiredWorkers = this.defineRequiredWorkers(businessType, model, research);
    const requiredIntegrations = this.defineRequiredIntegrations(model, businessType);
    const requiredAssets = this.defineRequiredAssets(businessType, model, research);
    const milestones = this.defineMilestones(businessType, operationalWorkflow);
    const dependencies = this.defineDependencies(
      model,
      research,
      evaluation,
      operationalWorkflow,
      milestones,
    );
    const preservedDecisions = this.preserveDecisions(model, research, evaluation);
    const traceabilityRefs = this.buildTraceabilityRefs(model, research, evaluation, input);

    return {
      blueprintId:
        input.blueprintId?.trim() || `bbw-blueprint-${Date.now()}-${blueprintSequence}`,
      timestamp: now,
      businessBuildMissionId: missionId,
      businessType,
      businessObjective,
      productsServices,
      customerSegments,
      valueProposition,
      operationalWorkflow,
      requiredWorkers,
      requiredIntegrations,
      requiredAssets,
      milestones,
      dependencies,
      metadataVersion: BBW_METADATA_VERSION,
      blueprintVersion: BUSINESS_BLUEPRINT_VERSION,
      businessArchitecture: architecture,
      sourceBusinessModelId:
        input.businessModelId?.trim() || model.businessModelId?.trim() || null,
      sourceMarketResearchReportId:
        input.marketResearchReportId?.trim() || research.reportId?.trim() || null,
      sourceOpportunityEvaluationId:
        input.opportunityEvaluationId?.trim() || evaluation.evaluationId?.trim() || null,
      sourceIntentId:
        input.sourceIntentId?.trim() || model.sourceIntentId?.trim() || null,
      originalCommand:
        input.originalCommand?.trim() || model.originalCommand?.trim() || null,
      approvedOpportunityRecommendation: String(evaluation.recommendation ?? "Proceed"),
      overallOpportunityScore:
        evaluation.overallOpportunityScore == null
          ? null
          : Number(evaluation.overallOpportunityScore),
      preservedDecisions,
      traceabilityRefs,
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      workerId: config.workerId || BUSINESS_BLUEPRINT_WORKER_IDENTITY.workerId,
      neverExecuteBusiness: true,
      neverLaunchProducts: true,
      neverCreateBranding: true,
      neverBuildWebsites: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveCompleteTraceability: true,
      preserveAuditHistory: true,
      canonicalBlueprint: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  defineBusinessObjective(
    businessType: string,
    research: MarketResearchInput,
    evaluation: OpportunityEvaluationInput,
    valueProposition: string,
  ): string {
    const demand = research.marketDemand?.demandLevel ?? "validated";
    const score =
      evaluation.overallOpportunityScore != null
        ? ` (opportunity score ${evaluation.overallOpportunityScore})`
        : "";
    return `Build an executable ${businessType.replace(/_/g, " ")} business addressing ${demand} demand${score}: ${valueProposition}`;
  }

  defineArchitecture(
    model: BusinessModelInput,
    research: MarketResearchInput,
    businessType: string,
    valueProposition: string,
  ): BusinessArchitecture {
    return {
      architectureSummary: `Canonical ${businessType.replace(/_/g, " ")} architecture consolidating approved model, market research, and opportunity evaluation for downstream Empire Builder Factory execution.`,
      deliveryChannels: unique([
        this.defaultChannel(businessType),
        ...(model.requiredIntegrations ?? []).slice(0, 2),
      ]),
      revenueModel: model.revenueModel?.trim() || this.defaultRevenue(businessType),
      costModel: model.costModel?.trim() || this.defaultCost(businessType),
      operatingModel:
        model.operatingModel?.trim() ||
        `lean_ops_cycle_for_${businessType}`,
      targetMarket:
        research.targetMarket?.trim() ||
        (model.customerSegments?.[0] ?? this.defaultCustomer(businessType)),
      customerProblemsAddressed: unique([
        ...(research.customerProblems ?? []),
        valueProposition ? `deliver:${valueProposition}` : "",
      ]),
    };
  }

  defineProductsServices(model: BusinessModelInput, businessType: string): string[] {
    const fromModel = (model.productsServices ?? []).map((p) => p.trim()).filter(Boolean);
    if (fromModel.length) return unique(fromModel);
    switch (businessType) {
      case "commerce":
        return ["core product catalog", "checkout and fulfillment offers"];
      case "saas":
        return ["core software subscription", "tiered feature plans"];
      case "local_cleaning":
      case "local_services":
        return ["service packages", "recurring local service plans"];
      case "media":
        return ["content packages", "audience membership offers"];
      case "affiliate":
        return ["referral offers", "partner promotion packages"];
      case "digital_product":
        return ["digital assets", "downloadable product bundles"];
      case "agency":
        return ["client retainers", "project delivery packages"];
      default:
        return ["core offer", "supporting service package"];
    }
  }

  defineCustomerSegments(
    model: BusinessModelInput,
    research: MarketResearchInput,
  ): string[] {
    return unique([
      ...(model.customerSegments ?? []),
      ...(research.customerSegments ?? []),
      research.targetMarket?.trim() || "",
    ]);
  }

  defineOperationalWorkflow(
    businessType: string,
    model: BusinessModelInput,
  ): WorkflowStep[] {
    const channel = this.defaultChannel(businessType);
    const steps: WorkflowStep[] = [
      {
        stepId: "wf-01",
        name: "offer_definition",
        description: `Finalize ${businessType.replace(/_/g, " ")} offer package from approved blueprint products/services`,
        ownerWorkerRole: "role-offer-designer",
        dependsOn: [],
      },
      {
        stepId: "wf-02",
        name: "channel_setup",
        description: `Configure primary delivery channel (${channel}) and required integrations`,
        ownerWorkerRole: "role-integration-specialist",
        dependsOn: ["wf-01"],
      },
      {
        stepId: "wf-03",
        name: "acquisition_ops",
        description: "Stand up customer acquisition workflow against approved segments",
        ownerWorkerRole: "role-growth-operator",
        dependsOn: ["wf-02"],
      },
      {
        stepId: "wf-04",
        name: "delivery_ops",
        description:
          model.operatingModel?.trim() ||
          `Execute delivery operations for ${businessType.replace(/_/g, " ")}`,
        ownerWorkerRole: "role-operations-specialist",
        dependsOn: ["wf-03"],
      },
      {
        stepId: "wf-05",
        name: "support_and_retention",
        description: "Operate support, feedback, and retention loops",
        ownerWorkerRole: "role-support-ops",
        dependsOn: ["wf-04"],
      },
      {
        stepId: "wf-06",
        name: "measurement_and_reporting",
        description: "Measure milestones and report progress through executive reporting",
        ownerWorkerRole: "role-analyst-performance",
        dependsOn: ["wf-05"],
      },
    ];
    return steps;
  }

  defineRequiredWorkers(
    businessType: string,
    model: BusinessModelInput,
    research: MarketResearchInput,
  ): RequiredWorkerSpec[] {
    const workers: RequiredWorkerSpec[] = [
      {
        workerRole: "role-offer-designer",
        purpose: "Define and refine products/services from the blueprint",
        skills: ["skill-offer-design", "skill-customer-segmentation"],
        priority: "critical",
      },
      {
        workerRole: "role-integration-specialist",
        purpose: "Configure required external integrations",
        skills: ["skill-integration-setup", "skill-ops-foundation"],
        priority: "critical",
      },
      {
        workerRole: "role-operations-specialist",
        purpose: "Run day-to-day delivery operations",
        skills: ["skill-ops-process", ...(model.requiredCapabilities ?? []).slice(0, 2)],
        priority: "critical",
      },
      {
        workerRole: "role-growth-operator",
        purpose: "Acquire customers in approved segments",
        skills: ["skill-customer-acquisition", "skill-analytics-metrics"],
        priority: "high",
      },
      {
        workerRole: "role-analyst-performance",
        purpose: "Track milestones and produce executive signals",
        skills: ["skill-analytics-metrics", "skill-research-synthesis"],
        priority: "medium",
      },
    ];
    if (businessType === "commerce" || businessType === "digital_product") {
      workers.push({
        workerRole: "role-fulfillment-specialist",
        purpose: "Manage order/digital fulfillment reliability",
        skills: ["skill-fulfillment", "skill-ops-process"],
        priority: "high",
      });
    }
    if (businessType === "saas") {
      workers.push({
        workerRole: "role-product-specialist",
        purpose: "Iterate product features and billing readiness",
        skills: ["skill-product-iteration", "skill-subscription-billing"],
        priority: "high",
      });
    }
    if (
      businessType === "local_cleaning" ||
      businessType === "local_services" ||
      (research.targetMarket ?? "").toLowerCase().includes("local")
    ) {
      workers.push({
        workerRole: "role-field-service-coordinator",
        purpose: "Coordinate local scheduling and field delivery",
        skills: ["skill-scheduling", "skill-field-service-delivery"],
        priority: "high",
      });
    }
    return workers;
  }

  defineRequiredIntegrations(
    model: BusinessModelInput,
    businessType: string,
  ): string[] {
    const fromModel = (model.requiredIntegrations ?? []).map((i) => slug(i));
    const defaults = [slug(this.defaultChannel(businessType)), "structured_reporting"];
    if (businessType === "commerce") defaults.push("payments", "fulfillment");
    if (businessType === "saas") defaults.push("billing", "analytics");
    if (businessType === "affiliate") defaults.push("tracking", "partner_payouts");
    if (businessType === "local_cleaning" || businessType === "local_services") {
      defaults.push("scheduling", "payments");
    }
    if (businessType === "media") defaults.push("publishing", "monetization");
    if (businessType === "digital_product") defaults.push("checkout", "delivery");
    if (businessType === "agency") defaults.push("crm", "project_tracking");
    return unique([...fromModel, ...defaults]);
  }

  defineRequiredAssets(
    businessType: string,
    model: BusinessModelInput,
    research: MarketResearchInput,
  ): string[] {
    return unique([
      "approved_business_blueprint",
      "customer_segment_register",
      "offer_catalog",
      "integration_configuration_sheet",
      "milestone_tracker",
      `operating_playbook_${businessType}`,
      model.revenueModel ? `revenue_model_spec` : "",
      research.reportId ? `market_research_ref_${research.reportId}` : "market_research_packet",
      ...(model.requiredCapabilities ?? []).map((c) => `capability_asset_${slug(c)}`),
    ]);
  }

  defineMilestones(
    businessType: string,
    workflow: WorkflowStep[],
  ): MilestoneSpec[] {
    return [
      {
        milestoneId: "ms-01",
        name: "blueprint_ready",
        description: "Canonical business blueprint accepted for downstream planning",
        sequence: 1,
        dependsOn: [],
        successCriteria: [
          "blueprint_machine_readable",
          "traceability_refs_complete",
          "required_workers_identified",
        ],
      },
      {
        milestoneId: "ms-02",
        name: "offer_and_channel_ready",
        description: "Products/services and primary channel configuration specified",
        sequence: 2,
        dependsOn: ["ms-01", workflow[0]?.stepId ?? "wf-01"],
        successCriteria: ["products_services_defined", "integrations_listed"],
      },
      {
        milestoneId: "ms-03",
        name: "operations_ready",
        description: "Operational workflow and worker roles ready for assignment",
        sequence: 3,
        dependsOn: ["ms-02", "wf-04"],
        successCriteria: [
          "operational_workflow_complete",
          "required_workers_prioritized",
        ],
      },
      {
        milestoneId: "ms-04",
        name: "launch_readiness_gate",
        description: `Launch-readiness gate for ${businessType.replace(/_/g, " ")} — specification only, not execution`,
        sequence: 4,
        dependsOn: ["ms-03", "wf-06"],
        successCriteria: [
          "milestones_tracked",
          "dependencies_resolved_or_listed",
          "executive_report_submitted",
        ],
      },
    ];
  }

  defineDependencies(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evaluation: OpportunityEvaluationInput,
    workflow: WorkflowStep[],
    milestones: MilestoneSpec[],
  ): DependencySpec[] {
    const deps: DependencySpec[] = [
      {
        dependencyId: "dep-model",
        description: "Approved business model required before blueprint finalization",
        source: "business_model",
        blocks: ["ms-01", workflow[0]?.stepId ?? "wf-01"],
      },
      {
        dependencyId: "dep-research",
        description: "Market research report required for segments, problems, and risks",
        source: "market_research",
        blocks: ["ms-02", "wf-03"],
      },
      {
        dependencyId: "dep-evaluation",
        description: "Proceed opportunity evaluation required before blueprint production",
        source: "opportunity_evaluation",
        blocks: ["ms-01"],
      },
      {
        dependencyId: "dep-integrations",
        description: "External integrations must be configured before delivery ops",
        source: "blueprint",
        blocks: ["wf-04", "ms-03"],
      },
      {
        dependencyId: "dep-workers",
        description: "Required AI workers must be assignable before operations-ready milestone",
        source: "blueprint",
        blocks: ["ms-03", milestones[2]?.milestoneId ?? "ms-03"],
      },
    ];
    if ((research.barriersToEntry?.length ?? 0) > 0) {
      deps.push({
        dependencyId: "dep-barriers",
        description: `Address barriers: ${(research.barriersToEntry ?? []).slice(0, 3).join(", ")}`,
        source: "market_research",
        blocks: ["ms-04"],
      });
    }
    if (model.businessModelId) {
      deps[0]!.description += ` (model=${model.businessModelId})`;
    }
    if (evaluation.evaluationId) {
      deps[2]!.description += ` (evaluation=${evaluation.evaluationId})`;
    }
    return deps;
  }

  preserveDecisions(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evaluation: OpportunityEvaluationInput,
  ): string[] {
    return unique([
      model.businessModelType
        ? `business_model_type=${model.businessModelType}`
        : "",
      model.revenueModel ? `revenue_model=${model.revenueModel}` : "",
      model.costModel ? `cost_model=${model.costModel}` : "",
      model.operatingModel ? `operating_model=${model.operatingModel}` : "",
      research.marketDemand?.demandLevel
        ? `demand_level=${research.marketDemand.demandLevel}`
        : "",
      research.opportunitySize?.opportunityLevel
        ? `opportunity_level=${research.opportunitySize.opportunityLevel}`
        : "",
      evaluation.recommendation
        ? `opportunity_recommendation=${evaluation.recommendation}`
        : "",
      evaluation.overallOpportunityScore != null
        ? `overall_opportunity_score=${evaluation.overallOpportunityScore}`
        : "",
      evaluation.strategicFitScore != null
        ? `strategic_fit_score=${evaluation.strategicFitScore}`
        : "",
      ...(model.businessAssumptions ?? []),
    ]);
  }

  buildTraceabilityRefs(
    model: BusinessModelInput,
    research: MarketResearchInput,
    evaluation: OpportunityEvaluationInput,
    input: BusinessBlueprintWorkerInput,
  ): string[] {
    return unique([
      model.businessModelId ? `q2-03:business_model:${model.businessModelId}` : "",
      research.reportId ? `q2-04:market_research:${research.reportId}` : "",
      evaluation.evaluationId
        ? `q2-05:opportunity_evaluation:${evaluation.evaluationId}`
        : "",
      model.sourceIntentId ? `q2-02:business_intent:${model.sourceIntentId}` : "",
      input.sourceIntentId ? `q2-02:business_intent:${input.sourceIntentId}` : "",
      evaluation.sourceBusinessModelId
        ? `trace:model_from_eval:${evaluation.sourceBusinessModelId}`
        : "",
      evaluation.sourceMarketResearchReportId
        ? `trace:research_from_eval:${evaluation.sourceMarketResearchReportId}`
        : "",
    ]);
  }

  defaultChannel(businessType: string): string {
    switch (businessType) {
      case "commerce":
        return "online_storefront";
      case "saas":
        return "web_application";
      case "local_cleaning":
      case "local_services":
        return "local_booking_channel";
      case "media":
        return "publishing_platforms";
      case "affiliate":
        return "partner_channels";
      case "digital_product":
        return "digital_storefront";
      case "agency":
        return "direct_client_channel";
      default:
        return "primary_distribution_channel";
    }
  }

  defaultRevenue(businessType: string): string {
    switch (businessType) {
      case "commerce":
        return "product_sales_and_margin_revenue";
      case "saas":
        return "recurring_subscription_revenue";
      case "affiliate":
        return "commission_and_performance_revenue";
      default:
        return `${businessType}_revenue_model`;
    }
  }

  defaultCost(businessType: string): string {
    switch (businessType) {
      case "commerce":
        return "inventory_fulfillment_and_platform_fees";
      case "saas":
        return "platform_hosting_and_product_development_costs";
      default:
        return "lean_operating_costs";
    }
  }

  defaultCustomer(businessType: string): string {
    switch (businessType) {
      case "commerce":
        return "online shoppers";
      case "saas":
        return "teams needing recurring software value";
      case "local_cleaning":
      case "local_services":
        return "local households and small businesses";
      default:
        return "early target customers";
    }
  }
}

let blueprintSequence = 0;

export function resetBlueprintSequenceForTesting() {
  blueprintSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function slug(value: string): string {
  return (
    value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") ||
    "asset"
  );
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneBlueprint(blueprint: BusinessBlueprint): BusinessBlueprint {
  return {
    ...blueprint,
    productsServices: [...blueprint.productsServices],
    customerSegments: [...blueprint.customerSegments],
    requiredIntegrations: [...blueprint.requiredIntegrations],
    requiredAssets: [...blueprint.requiredAssets],
    preservedDecisions: [...blueprint.preservedDecisions],
    traceabilityRefs: [...blueprint.traceabilityRefs],
    operationalWorkflow: blueprint.operationalWorkflow.map((s) => ({
      ...s,
      dependsOn: [...s.dependsOn],
    })),
    requiredWorkers: blueprint.requiredWorkers.map((w) => ({
      ...w,
      skills: [...w.skills],
    })),
    milestones: blueprint.milestones.map((m) => ({
      ...m,
      dependsOn: [...m.dependsOn],
      successCriteria: [...m.successCriteria],
    })),
    dependencies: blueprint.dependencies.map((d) => ({
      ...d,
      blocks: [...d.blocks],
    })),
    businessArchitecture: {
      ...blueprint.businessArchitecture,
      deliveryChannels: [...blueprint.businessArchitecture.deliveryChannels],
      customerProblemsAddressed: [
        ...blueprint.businessArchitecture.customerProblemsAddressed,
      ],
    },
  };
}

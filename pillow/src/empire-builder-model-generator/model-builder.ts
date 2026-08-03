import type { EmpireBuilderModelGeneratorConfiguration } from "./configuration.js";
import {
  BUSINESS_MODEL_VERSION,
  EMG_METADATA_VERSION,
} from "./paths.js";
import type {
  BusinessModelType,
  BusinessType,
  EmpireBuilderBusinessModel,
  EmpireBuilderModelGeneratorCatalog,
  EmpireBuilderModelGeneratorInput,
  StructuredBusinessIntentInput,
} from "./types.js";

/** Pure Empire Builder Model Generator helpers for Q2-03 — blueprint only. */
export class ModelBuilder {
  buildCatalog(
    config: EmpireBuilderModelGeneratorConfiguration,
    models: EmpireBuilderBusinessModel[],
  ): EmpireBuilderModelGeneratorCatalog {
    return {
      modelVersion: BUSINESS_MODEL_VERSION,
      businessModelTypes: [...config.businessModelTypes],
      models: models.map(cloneModel),
      metadataVersion: EMG_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverValidateDemand: true,
      neverPerformMarketResearch: true,
      neverBuildBranding: true,
      neverAssignWorkers: true,
      neverLaunchBusiness: true,
      neverImplementQ204OrLater: true,
    };
  }

  resolveIntent(input: EmpireBuilderModelGeneratorInput): StructuredBusinessIntentInput {
    const nested = input.intent ?? {};
    return {
      intentId: input.intentId ?? nested.intentId ?? null,
      originalCommand: input.originalCommand ?? nested.originalCommand ?? null,
      businessType: input.businessType ?? nested.businessType ?? null,
      businessIdea: input.businessIdea ?? nested.businessIdea ?? null,
      targetCustomer: input.targetCustomer ?? nested.targetCustomer ?? null,
      productServiceCategory:
        input.productServiceCategory ?? nested.productServiceCategory ?? null,
      channelPlatform: input.channelPlatform ?? nested.channelPlatform ?? null,
      constraints: input.constraints ?? nested.constraints ?? null,
      successObjective: input.successObjective ?? nested.successObjective ?? null,
      confidenceScore: input.confidenceScore ?? nested.confidenceScore ?? null,
      missingInformation: input.missingInformation ?? nested.missingInformation ?? null,
    };
  }

  generate(
    input: EmpireBuilderModelGeneratorInput,
    config: EmpireBuilderModelGeneratorConfiguration,
  ): EmpireBuilderBusinessModel {
    modelSequence += 1;
    const intent = this.resolveIntent(input);
    const businessType = normalizeType(
      intent.businessType || input.businessType || "unknown",
    ) as BusinessType | string;
    const businessModelType = normalizeType(
      input.businessModelType || this.determineModelType(businessType, config),
    );
    const businessIdea =
      intent.businessIdea?.trim() ||
      intent.originalCommand?.trim() ||
      `Build a ${String(businessType).replace(/_/g, " ")} business`;
    const customer =
      intent.targetCustomer?.trim() ||
      this.defaultCustomerSegment(businessType);
    const category =
      intent.productServiceCategory?.trim() ||
      String(businessType).replace(/_/g, " ");
    const channel = intent.channelPlatform?.trim() || this.defaultChannel(businessType);
    const constraints = unique([...(intent.constraints ?? []), ...(input.constraints ?? [])]);
    const successObjective =
      intent.successObjective?.trim() ||
      "Establish a sustainable operating business blueprint ready for later Q2 planning.";

    const valueProposition =
      input.valueProposition?.trim() ||
      this.defineValueProposition(businessType, businessIdea, customer, category);
    const productsServices =
      input.productsServices?.map((v) => v.trim()).filter(Boolean) ||
      this.defineProductsServices(businessType, category);
    const customerSegments =
      input.customerSegments?.map((v) => v.trim()).filter(Boolean) ||
      this.defineCustomerSegments(businessType, customer);
    const revenueModel =
      input.revenueModel?.trim() || this.defineRevenueModel(businessType, businessModelType);
    const costModel =
      input.costModel?.trim() || this.defineCostModel(businessType, constraints);
    const operatingModel =
      input.operatingModel?.trim() ||
      this.defineOperatingModel(businessType, channel, constraints);
    const requiredCapabilities =
      input.requiredCapabilities?.map((v) => v.trim()).filter(Boolean) ||
      this.defineCapabilities(businessType);
    const requiredIntegrations =
      input.requiredIntegrations?.map((v) => v.trim()).filter(Boolean) ||
      this.defineIntegrations(businessType, channel);
    const businessAssumptions =
      input.businessAssumptions?.map((v) => v.trim()).filter(Boolean) ||
      this.defineAssumptions(businessType, successObjective, constraints, intent);

    return {
      businessModelId:
        input.businessModelId?.trim() || `emg-model-${Date.now()}-${modelSequence}`,
      timestamp: new Date().toISOString(),
      businessType,
      businessModelType,
      valueProposition,
      productsServices,
      customerSegments,
      revenueModel,
      costModel,
      operatingModel,
      requiredCapabilities,
      requiredIntegrations,
      businessAssumptions,
      metadataVersion: EMG_METADATA_VERSION,
      modelVersion: BUSINESS_MODEL_VERSION,
      sourceIntentId: intent.intentId?.trim() || null,
      originalCommand: intent.originalCommand?.trim() || null,
      preparedForDownstreamPlanning: true,
      neverValidateDemand: true,
      neverPerformMarketResearch: true,
      neverBuildBranding: true,
      neverAssignWorkers: true,
      neverLaunchBusiness: true,
      neverImplementQ204OrLater: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  determineModelType(
    businessType: string,
    config: EmpireBuilderModelGeneratorConfiguration,
  ): BusinessModelType | string {
    const map: Record<string, BusinessModelType> = {
      media: "media_content",
      commerce: "commerce_retail",
      local_cleaning: "local_service",
      local_services: "local_service",
      affiliate: "affiliate_referral",
      digital_product: "digital_product",
      saas: "saas_subscription",
      agency: "agency_services",
      unknown: "unknown",
    };
    const resolved = map[businessType] ?? "hybrid";
    return config.businessModelTypes.includes(resolved) ? resolved : "unknown";
  }

  defineValueProposition(
    businessType: string,
    businessIdea: string,
    customer: string,
    category: string,
  ): string {
    return `Deliver ${category} value to ${customer} through a ${businessType.replace(/_/g, " ")} model derived from: ${businessIdea}`;
  }

  defineProductsServices(businessType: string, category: string): string[] {
    switch (businessType) {
      case "media":
        return [`${category} content packages`, "audience membership offers"];
      case "commerce":
        return [`${category} product catalog`, "checkout and fulfillment offers"];
      case "local_cleaning":
      case "local_services":
        return [`${category} service packages`, "recurring local service plans"];
      case "affiliate":
        return [`${category} referral offers`, "partner promotion packages"];
      case "digital_product":
        return [`${category} digital assets`, "downloadable product bundles"];
      case "saas":
        return [`${category} software subscription`, "tiered feature plans"];
      case "agency":
        return [`${category} client retainers`, "project delivery packages"];
      default:
        return [`${category} core offer`, "supporting service package"];
    }
  }

  defineCustomerSegments(businessType: string, customer: string): string[] {
    const primary = customer;
    const secondary =
      businessType === "affiliate"
        ? "partner creators and publishers"
        : businessType === "local_cleaning" || businessType === "local_services"
          ? "nearby residential and small-business customers"
          : "early adopters seeking the core offer";
    return unique([primary, secondary]);
  }

  defineRevenueModel(businessType: string, modelType: string): string {
    switch (businessType) {
      case "media":
        return "subscription_and_sponsorship_revenue";
      case "commerce":
        return "product_sales_and_margin_revenue";
      case "local_cleaning":
      case "local_services":
        return "service_fees_and_recurring_contracts";
      case "affiliate":
        return "commission_and_performance_revenue";
      case "digital_product":
        return "one_time_digital_sales_and_upsells";
      case "saas":
        return "recurring_subscription_revenue";
      case "agency":
        return "retainer_and_project_fee_revenue";
      default:
        return `${modelType}_revenue_blueprint`;
    }
  }

  defineCostModel(businessType: string, constraints: string[]): string {
    const lean = constraints.some((c) => /solo|budget|no_hiring/i.test(c));
    const base =
      businessType === "local_cleaning" || businessType === "local_services"
        ? "labor_tools_and_local_operations_costs"
        : businessType === "commerce"
          ? "inventory_fulfillment_and_platform_fees"
          : businessType === "saas"
            ? "platform_hosting_and_product_development_costs"
            : "content_ops_and_acquisition_costs";
    return lean ? `lean_${base}` : base;
  }

  defineOperatingModel(
    businessType: string,
    channel: string,
    constraints: string[],
  ): string {
    const localOnly = constraints.includes("local_only");
    if (localOnly) {
      return `local_ops_via_${channel.replace(/\s+/g, "_").toLowerCase()}`;
    }
    switch (businessType) {
      case "media":
        return `content_production_and_distribution_via_${slug(channel)}`;
      case "commerce":
        return `catalog_fulfillment_and_customer_support_via_${slug(channel)}`;
      case "affiliate":
        return `partner_promotion_tracking_via_${slug(channel)}`;
      case "digital_product":
        return `digital_delivery_and_support_via_${slug(channel)}`;
      case "saas":
        return `product_ops_and_customer_success_via_${slug(channel)}`;
      case "agency":
        return `client_delivery_ops_via_${slug(channel)}`;
      default:
        return `lean_operating_cycle_via_${slug(channel)}`;
    }
  }

  defineCapabilities(businessType: string): string[] {
    const shared = ["offer_definition", "customer_acquisition", "delivery_operations"];
    const specific: Record<string, string[]> = {
      media: ["content_production", "audience_growth"],
      commerce: ["catalog_management", "order_fulfillment"],
      local_cleaning: ["scheduling", "field_service_delivery"],
      local_services: ["scheduling", "field_service_delivery"],
      affiliate: ["partner_recruitment", "conversion_tracking"],
      digital_product: ["product_packaging", "digital_fulfillment"],
      saas: ["product_iteration", "subscription_billing"],
      agency: ["client_management", "delivery_quality_control"],
    };
    return unique([...shared, ...(specific[businessType] ?? ["general_operations"])]);
  }

  defineIntegrations(businessType: string, channel: string): string[] {
    const integrations = [slug(channel)];
    if (businessType === "commerce") integrations.push("payments", "fulfillment");
    if (businessType === "saas") integrations.push("billing", "analytics");
    if (businessType === "affiliate") integrations.push("tracking", "partner_payouts");
    if (businessType === "local_cleaning" || businessType === "local_services") {
      integrations.push("scheduling", "payments");
    }
    if (businessType === "media") integrations.push("publishing", "monetization");
    if (businessType === "digital_product") integrations.push("checkout", "delivery");
    if (businessType === "agency") integrations.push("crm", "project_tracking");
    return unique(integrations);
  }

  defineAssumptions(
    businessType: string,
    successObjective: string,
    constraints: string[],
    intent: StructuredBusinessIntentInput,
  ): string[] {
    const assumptions = [
      `business_type_assumed=${businessType}`,
      `success_objective_assumed=${successObjective}`,
      "demand_not_validated_in_this_mission",
      "market_research_deferred_to_later_q2_missions",
    ];
    if (intent.confidenceScore != null) {
      assumptions.push(`intent_confidence=${intent.confidenceScore}`);
    }
    if (intent.missingInformation?.length) {
      assumptions.push(`missing_intent_fields=${intent.missingInformation.join("|")}`);
    }
    for (const constraint of constraints) {
      assumptions.push(`constraint=${constraint}`);
    }
    return unique(assumptions);
  }

  defaultCustomerSegment(businessType: string): string {
    switch (businessType) {
      case "media":
        return "content consumers and subscribers";
      case "commerce":
        return "online shoppers";
      case "local_cleaning":
      case "local_services":
        return "local households and small businesses";
      case "affiliate":
        return "buyers influenced by trusted recommenders";
      case "digital_product":
        return "self-serve digital buyers";
      case "saas":
        return "teams needing recurring software value";
      case "agency":
        return "clients needing specialist delivery";
      default:
        return "early target customers";
    }
  }

  defaultChannel(businessType: string): string {
    switch (businessType) {
      case "commerce":
        return "online storefront";
      case "local_cleaning":
      case "local_services":
        return "local booking channel";
      case "affiliate":
        return "partner channels";
      case "media":
        return "publishing platforms";
      case "digital_product":
        return "digital storefront";
      case "saas":
        return "web application";
      case "agency":
        return "direct client channel";
      default:
        return "primary distribution channel";
    }
  }
}

let modelSequence = 0;

export function resetModelSequenceForTesting() {
  modelSequence = 0;
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function slug(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "") || "channel";
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneModel(model: EmpireBuilderBusinessModel): EmpireBuilderBusinessModel {
  return {
    ...model,
    productsServices: [...model.productsServices],
    customerSegments: [...model.customerSegments],
    requiredCapabilities: [...model.requiredCapabilities],
    requiredIntegrations: [...model.requiredIntegrations],
    businessAssumptions: [...model.businessAssumptions],
  };
}

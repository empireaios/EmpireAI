import type { CommerceOperatingModel } from "../commerce-operating-model/types.js";
import {
  BUSINESS_AUTOMATION_PIPELINE,
  BUSINESS_AUTOMATION_PRINCIPLES,
  BUSINESS_AUTOMATION_LEVELS,
  AUTOMATED_BUSINESS_CAPABILITIES,
} from "./paths.js";
import type {
  BusinessAutomationArchitecture,
  BusinessAutomationLevel,
  BusinessAutomationPipelinePhase,
  AutomationRule,
  ActiveAutomationRecord,
} from "./types.js";

function label(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapZeroHumanLevel(level: string): BusinessAutomationLevel {
  const l = level.toLowerCase();
  if (l.includes("constitutional") || l.includes("level_4")) return "constitutional_automation";
  if (l.includes("supervised") || l.includes("level_3")) return "supervised_automation";
  if (l.includes("semi") || l.includes("level_2")) return "semi_automated";
  if (l.includes("assisted") || l.includes("level_1")) return "assisted";
  return "manual";
}

function pipelinePhaseFromCommerce(commerce: CommerceOperatingModel): BusinessAutomationPipelinePhase {
  const lifecycle = commerce.businesses[0]?.lifecycleStage ?? "business_created";
  const map: Record<string, BusinessAutomationPipelinePhase> = {
    business_created: "business_created",
    business_configured: "business_configured",
    business_launch_ready: "automation_rules_loaded",
    business_live: "marketing_activated",
    business_growing: "performance_analysed",
    business_optimising: "business_optimised",
    business_mature: "continuous_improvement",
    business_historical: "continuous_improvement",
  };
  return map[lifecycle] ?? "business_configured";
}

function buildPipeline(activePhase: BusinessAutomationPipelinePhase) {
  const activeIdx = BUSINESS_AUTOMATION_PIPELINE.indexOf(activePhase);
  return BUSINESS_AUTOMATION_PIPELINE.map((phase, i) => ({
    phase,
    label: label(phase),
    order: i + 1,
    status: (i < activeIdx ? "complete" : i === activeIdx ? "active" : "pending") as
      | "complete"
      | "active"
      | "pending",
  }));
}

function defaultRules(commerce: CommerceOperatingModel): AutomationRule[] {
  const biz = commerce.businesses[0]?.id ?? "portfolio";
  return [
    {
      id: "rule-product-publish",
      name: "Product Publishing",
      capability: "product_publishing",
      trigger: "Business launch ready · catalogue approved",
      conditions: ["Commerce configured", "Supplier connected", "CRIR gate passed"],
      actions: ["Publish products to store", "Sync marketplace listings"],
      dependencies: ["Marketplace Integration", "Commerce Operating Model"],
      safetyRules: ["Grand King approval for live publish", "Build-only until production truth"],
      rollbackStrategy: "Unpublish listing · revert to draft catalogue",
      recoveryStrategy: "Autonomous Recovery Engine · Supervisor validation",
      auditTrail: "Pillow host · business-automation audit",
      status: commerce.liveBusinessCount > 0 ? ("active" as const) : ("pending" as const),
    },
    {
      id: "rule-order-route",
      name: "Order Routing",
      capability: "order_routing",
      trigger: "Customer order received",
      conditions: ["Payment confirmed", "Inventory available"],
      actions: ["Route to fulfilment provider", "Notify customer"],
      dependencies: ["Order management", "Supplier sync"],
      safetyRules: ["Guardian health check before dispatch"],
      rollbackStrategy: "Hold order · refund workflow",
      recoveryStrategy: "Recovery doctrine · manual Grand King escalation",
      auditTrail: "Order pipeline · Guardian monitoring",
      status: commerce.orders.length > 0 ? ("active" as const) : ("standby" as const),
    },
    {
      id: "rule-marketing",
      name: "Marketing Activation",
      capability: "advertising_coordination",
      trigger: "Store live · products published",
      conditions: ["Meta OAuth connected", "Ad creative approved"],
      actions: ["Launch prospecting campaign", "Track ROAS"],
      dependencies: ["Marketing management", "Advertising intelligence"],
      safetyRules: ["Budget caps · Founder-first spend approval"],
      rollbackStrategy: "Pause campaigns · preserve audit trail",
      recoveryStrategy: "ECC rescheduling · Pillow recommendations",
      auditTrail: "Marketing automation registry",
      status:
        commerce.businesses[0]?.lifecycleStage === "business_live" ? ("active" as const) : ("pending" as const),
    },
  ].map((r) => ({ ...r, capability: r.capability, dependencies: [...r.dependencies, biz] }));
}

export function assembleBusinessAutomationArchitecture(input: {
  commerce?: CommerceOperatingModel;
  zeroHuman?: Record<string, unknown>;
  marketplace?: { connectedCount?: number; connectorCount?: number };
  ecc?: Record<string, unknown>;
  supervisor?: Record<string, unknown>;
  guardian?: Record<string, unknown>;
  recovery?: Record<string, unknown>;
  journey?: Record<string, unknown>;
}): BusinessAutomationArchitecture {
  const commerce = input.commerce;
  const zeroHuman = input.zeroHuman ?? {};
  const recovery = input.recovery ?? {};
  const analysis = (zeroHuman.analysis ?? {}) as { recommendations?: string[]; efficiency?: string[] };

  const currentLevel = mapZeroHumanLevel(String(zeroHuman.automationLevel ?? "semi_automated"));
  const targetLevel: BusinessAutomationLevel =
    currentLevel === "constitutional_automation" ? "constitutional_automation" : "supervised_automation";

  const pipelinePhase = commerce ? pipelinePhaseFromCommerce(commerce) : "automation_rules_loaded";
  const rules = commerce ? defaultRules(commerce) : [];

  const activeAutomations: ActiveAutomationRecord[] = [];
  const pendingAutomations: ActiveAutomationRecord[] = [];

  if (zeroHuman.activeAutomation && zeroHuman.activeAutomation !== "None — standby") {
    activeAutomations.push({
      id: "zha-active",
      name: String(zeroHuman.activeAutomation),
      status: "running",
      businessId: commerce?.businesses[0]?.id ?? null,
      performance: String(zeroHuman.automationSuccessRate ?? "—"),
    });
  }

  for (const rule of rules) {
    const rec: ActiveAutomationRecord = {
      id: rule.id,
      name: rule.name,
      status: rule.status,
      businessId: commerce?.businesses[0]?.id ?? null,
      performance: rule.status === "active" ? "Operational" : "Awaiting gate",
    };
    if (rule.status === "active") activeAutomations.push(rec);
    else pendingAutomations.push(rec);
  }

  const queued = zeroHuman.queuedAutomation;
  if (Array.isArray(queued)) {
    for (const q of queued.slice(0, 5)) {
      pendingAutomations.push({
        id: `queued-${String(q).slice(0, 20)}`,
        name: String(q),
        status: "queued",
        businessId: null,
        performance: "Scheduled",
      });
    }
  }

  const subsystemLevels = (zeroHuman.subsystemLevels ?? []) as Array<{
    label: string;
    current: string;
    target: string;
  }>;

  const automationLevels = BUSINESS_AUTOMATION_LEVELS.map((level) => ({
    level,
    label: label(level),
    current: level === currentLevel,
    target: level === targetLevel,
    dependencies:
      level === "constitutional_automation"
        ? ["All safety stops validated", "Recovery framework active", "Grand King override tested"]
        : ["Progressive subsystem upgrades"],
    safetyRequirements: [
      "Observable in Cockpit",
      "Recoverable via Autonomous Recovery",
      "No hidden decisions",
    ],
  }));

  const pillow: BusinessAutomationArchitecture["pillow"] = {
    opportunities: commerce?.currentOpportunities ?? [],
    efficiency: analysis.efficiency ?? [
      `Pipeline progress ${String(zeroHuman.pipelineProgress ?? "—")}`,
      `Success rate ${String(zeroHuman.automationSuccessRate ?? "—")}`,
    ],
    commercialPerformance: commerce?.pillow.performance ?? [],
    safety: (zeroHuman.safetyStops as string[]) ?? ["Constitutional safety stops armed"],
    growthOpportunities: commerce?.pillow.growthOpportunities ?? [],
    operationalImprovements: analysis.recommendations ?? [],
    recommendations: [
      ...(analysis.recommendations ?? []),
      ...(commerce?.pillow.growthOpportunities ?? []).slice(0, 2),
      "Upgrade toward supervised automation with evidence-backed gates",
    ],
  };

  return {
    architectureVersion: "P8-04",
    computedAt: new Date().toISOString(),
    grandKingSummary:
      String(zeroHuman.grandKingSummary) ??
      commerce?.grandKingSummary ??
      "Business Automation — constitutionally governed commercial automation",
    automationStatus: String(zeroHuman.activeAutomation ?? "Standby — rules loaded"),
    automationLevel: label(currentLevel),
    targetAutomationLevel: label(targetLevel),
    automationHealth: String(zeroHuman.automationHealth ?? "healthy"),
    automationPerformance: String(zeroHuman.automationSuccessRate ?? "92%"),
    automationRecovery: String(zeroHuman.recoveryStatus ?? recovery?.currentIncident ?? "None"),
    businessEfficiency: `${commerce?.liveBusinessCount ?? 0} live · ${activeAutomations.length} active automations`,
    activeAutomations,
    pendingAutomations,
    automationLevels,
    automationRules: rules,
    pipeline: buildPipeline(pipelinePhase),
    principles: [...BUSINESS_AUTOMATION_PRINCIPLES],
    capabilities: [...AUTOMATED_BUSINESS_CAPABILITIES],
    pillow,
    integrations: {
      factoryStage: commerce?.factoryIntegration.factoryStage ?? "—",
      commerceHealth: commerce?.commerceHealth ?? "building",
      marketplaceConnectors: input.marketplace?.connectedCount ?? input.marketplace?.connectorCount ?? 0,
      zeroHumanLevel: String(zeroHuman.automationLevel ?? "semi_automated"),
    },
  };
}

export function buildFallbackBusinessAutomationArchitecture(): BusinessAutomationArchitecture {
  return assembleBusinessAutomationArchitecture({
    zeroHuman: {
      grandKingSummary: "Start Pillow session for live business automation across portfolio",
      automationLevel: "Semi-Automated",
      automationHealth: "standby",
    },
  });
}

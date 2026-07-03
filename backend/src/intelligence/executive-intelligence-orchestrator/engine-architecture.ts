/**
 * G3-10 — Executive Intelligence Orchestrator · Architecture Layer
 * Coordinates G3-01–G3-09 into one unified Executive Intelligence service.
 * Schedules, coordinates, aggregates — owns no business logic.
 */

import { INTELLIGENCE_MODULE_CATALOG } from "../../brain/contract/module-ids.js";
import { loadDecisionIntelligenceEngineViewForWorkspace } from "../../domain/services/decision-intelligence-engine-views.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "../../domain/services/product-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "../../domain/services/quantitative-intelligence-engine-views.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "../../domain/services/advertising-intelligence-engine-views.js";
import { loadCustomerIntelligenceEngineViewForWorkspace } from "../../domain/services/customer-intelligence-engine-views.js";
import { loadRiskIntelligenceEngineViewForWorkspace } from "../../domain/services/risk-intelligence-engine-views.js";

export const G3_10_SCHEMA_VERSION = "g3-10-v1" as const;

export const G3_10_SUITE_ENGINE_REFS = [
  { moduleId: "product-intelligence", missionRef: "G3-01", brainModule: "product-intelligence-engine" },
  { moduleId: "market-intelligence", missionRef: "G3-02", brainModule: "market-intelligence-engine" },
  { moduleId: "supplier-intelligence", missionRef: "G3-03", brainModule: "supplier-intelligence-engine" },
  { moduleId: "financial-intelligence", missionRef: "G3-04", brainModule: "financial-intelligence-engine" },
  { moduleId: "quantitative-intelligence", missionRef: "G3-05", brainModule: "quantitative-intelligence-engine" },
  { moduleId: "advertising-intelligence", missionRef: "G3-06", brainModule: "advertising-intelligence-engine" },
  { moduleId: "customer-intelligence", missionRef: "G3-07", brainModule: "customer-intelligence-engine" },
  { moduleId: "risk-intelligence", missionRef: "G3-08", brainModule: "risk-intelligence-engine" },
  { moduleId: "decision-intelligence", missionRef: "G3-09", brainModule: "decision-intelligence-engine" },
] as const;

export type G310SuiteEngineId = (typeof G3_10_SUITE_ENGINE_REFS)[number]["moduleId"];

export const G3_10_CONSUMER_CHANNELS = [
  "cockpit",
  "pillow",
  "global-ai-assistant",
  "business-automation",
  "executive-reports",
] as const;

export type G310ConsumerChannelId = (typeof G3_10_CONSUMER_CHANNELS)[number];

export type ExecutiveIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
};

export type CoordinatedEngineStatus = {
  engineId: G310SuiteEngineId;
  engineLabel: string;
  missionRef: string;
  brainModule: string;
  executiveSummary: string;
  nextAction: string;
  available: boolean;
  orchestrationOnly: true;
};

export type IntelligenceScheduleSlot = {
  slotId: string;
  label: string;
  cadence: "continuous" | "hourly" | "daily" | "on-demand";
  engineIds: G310SuiteEngineId[];
  consumerChannels: G310ConsumerChannelId[];
};

export type ExecutiveIntelligenceConsumerDelivery = {
  consumerId: G310ConsumerChannelId;
  consumerLabel: string;
  deliveryMode: "full-suite" | "decision-first" | "summary-only" | "schedule-manifest" | "report-bundle";
  payloadSummary: string;
  recommendedAction: string;
  bridgeModule: string;
  orchestrationOnly: true;
};

/** G3-10 — Unified Executive Intelligence service contract. No business logic fields. */
export type ExecutiveIntelligenceUnifiedService = {
  serviceId: string;
  orchestrationPolicy: "no_business_logic";
  coordinatedEngineCount: number;
  enginesAvailable: number;
  aggregatedSummary: string;
  decisionSnapshot: {
    finalRecommendation: string;
    decisionConfidence: number;
    executiveRecommendation: string;
    reasoningSummary: string;
  };
  scheduleSlots: IntelligenceScheduleSlot[];
  consumerDeliveries: ExecutiveIntelligenceConsumerDelivery[];
  coordinatedEngines: CoordinatedEngineStatus[];
  supportingEvidence: ExecutiveIntelligenceEvidence[];
  computedAt: string;
};

export type ExecutiveIntelligenceCapabilityId =
  | "coordinate_executive_engines"
  | "schedule_intelligence_runs"
  | "aggregate_suite_outputs"
  | "cockpit_channel"
  | "pillow_channel"
  | "global_assistant_channel"
  | "business_automation_channel"
  | "executive_reports_channel";

export type ExecutiveIntelligenceCapabilityDefinition = {
  id: ExecutiveIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "orchestration";
};

export type ExecutiveIntelligenceOrchestratorArchitecture = {
  schemaVersion: typeof G3_10_SCHEMA_VERSION;
  computedAt: string;
  engineId: "executive-intelligence-orchestrator";
  displayName: string;
  missionRef: "G3-10";
  scopeGate: string;
  orchestrationPolicy: "no_business_logic";
  suiteEngines: Array<{ moduleId: G310SuiteEngineId; moduleName: string; missionRef: string }>;
  consumerChannels: G310ConsumerChannelId[];
  capabilities: ExecutiveIntelligenceCapabilityDefinition[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type ExecutiveIntelligenceOrchestratorView = {
  architecture: ExecutiveIntelligenceOrchestratorArchitecture;
  unifiedService: ExecutiveIntelligenceUnifiedService;
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_10_CAPABILITIES: readonly ExecutiveIntelligenceCapabilityDefinition[] = [
  {
    id: "coordinate_executive_engines",
    label: "Coordinate Executive AI Engines",
    description: "Coordinate G3-01–G3-09 engine summaries — no scoring or domain logic",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "schedule_intelligence_runs",
    label: "Schedule intelligence runs",
    description: "Architecture schedule manifest for continuous, hourly, daily, on-demand slots",
    implementationStatus: "partial",
    dataMode: "orchestration",
  },
  {
    id: "aggregate_suite_outputs",
    label: "Aggregate suite outputs",
    description: "Aggregate executive summaries and G3-09 decision snapshot",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "cockpit_channel",
    label: "Cockpit channel",
    description: "Full unified service delivery for Grand King Cockpit SCR-110",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "pillow_channel",
    label: "Pillow channel",
    description: "Decision-first delivery for Pillow approval context",
    implementationStatus: "partial",
    dataMode: "orchestration",
  },
  {
    id: "global_assistant_channel",
    label: "Global AI Assistant channel",
    description: "Summary delivery for G4-09 Global AI Assistant bridge",
    implementationStatus: "partial",
    dataMode: "orchestration",
  },
  {
    id: "business_automation_channel",
    label: "Business Automation channel",
    description: "Schedule manifest + decision gate for G5 automation triggers",
    implementationStatus: "architecture",
    dataMode: "orchestration",
  },
  {
    id: "executive_reports_channel",
    label: "Executive Reports channel",
    description: "Report bundle with all engine summaries and decision contract",
    implementationStatus: "partial",
    dataMode: "orchestration",
  },
];

export const G3_10_SCHEDULE_SLOTS: readonly IntelligenceScheduleSlot[] = [
  {
    slotId: "continuous-risk-decision",
    label: "Continuous risk and decision refresh",
    cadence: "continuous",
    engineIds: ["risk-intelligence", "decision-intelligence"],
    consumerChannels: ["cockpit", "pillow", "global-ai-assistant"],
  },
  {
    slotId: "hourly-commercial",
    label: "Hourly commercial intelligence sweep",
    cadence: "hourly",
    engineIds: ["product-intelligence", "market-intelligence", "financial-intelligence", "advertising-intelligence"],
    consumerChannels: ["cockpit", "business-automation", "executive-reports"],
  },
  {
    slotId: "daily-suite",
    label: "Daily full suite aggregation",
    cadence: "daily",
    engineIds: [
      "product-intelligence",
      "market-intelligence",
      "supplier-intelligence",
      "financial-intelligence",
      "quantitative-intelligence",
      "advertising-intelligence",
      "customer-intelligence",
      "risk-intelligence",
      "decision-intelligence",
    ],
    consumerChannels: ["executive-reports", "cockpit"],
  },
  {
    slotId: "on-demand-decision",
    label: "On-demand executive decision",
    cadence: "on-demand",
    engineIds: ["decision-intelligence"],
    consumerChannels: ["cockpit", "pillow", "global-ai-assistant", "business-automation"],
  },
];

export const G3_10_DATA_FLOW: ExecutiveIntelligenceOrchestratorArchitecture["dataFlow"] = [
  {
    stage: "1 — Suite roster",
    from: "INTELLIGENCE_MODULE_CATALOG → G3-01–G3-09",
    to: "Coordination manifest",
    description: "Executive engine roster discovered from Brain contract catalog",
  },
  {
    stage: "2 — Coordinate",
    from: "G3 engine view loaders",
    to: "CoordinatedEngineStatus[]",
    description: "Load pre-computed summaries only — G3-10 owns no business logic",
  },
  {
    stage: "3 — Aggregate",
    from: "Engine statuses + G3-09 decision snapshot",
    to: "ExecutiveIntelligenceUnifiedService",
    description: "Unified service with schedule slots and consumer deliveries",
  },
  {
    stage: "4 — Deliver",
    from: "Unified service",
    to: "Cockpit · Pillow · Global Assistant · Business Automation · Executive Reports",
    description: "Five consumer channels receive orchestrated payloads",
  },
];

function catalogName(moduleId: G310SuiteEngineId): string {
  return INTELLIGENCE_MODULE_CATALOG.find((e) => e.moduleId === moduleId)?.moduleName ?? moduleId;
}

type EngineLoader = (workspaceId: string) => { executiveSummary: string; nextExecutiveAction: string };

const ENGINE_LOADERS: Record<G310SuiteEngineId, EngineLoader> = {
  "product-intelligence": (ws) => {
    const v = loadProductIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "market-intelligence": (ws) => {
    const v = loadMarketIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "supplier-intelligence": (ws) => {
    const v = loadSupplierIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "financial-intelligence": (ws) => {
    const v = loadFinancialIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "quantitative-intelligence": (ws) => {
    const v = loadQuantitativeIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.summary, nextExecutiveAction: v.nextReviewAction };
  },
  "advertising-intelligence": (ws) => {
    const v = loadAdvertisingIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "customer-intelligence": (ws) => {
    const v = loadCustomerIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "risk-intelligence": (ws) => {
    const v = loadRiskIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
  "decision-intelligence": (ws) => {
    const v = loadDecisionIntelligenceEngineViewForWorkspace(ws);
    return { executiveSummary: v.executiveSummary, nextExecutiveAction: v.nextExecutiveAction };
  },
};

export function buildExecutiveIntelligenceDiscoveryView(): ExecutiveIntelligenceOrchestratorArchitecture["suiteEngines"] {
  return G3_10_SUITE_ENGINE_REFS.map(({ moduleId, missionRef }) => ({
    moduleId,
    moduleName: catalogName(moduleId),
    missionRef,
  }));
}

export function coordinateExecutiveEngines(workspaceId: string): CoordinatedEngineStatus[] {
  return G3_10_SUITE_ENGINE_REFS.map(({ moduleId, missionRef, brainModule }) => {
    try {
      const loaded = ENGINE_LOADERS[moduleId](workspaceId);
      return {
        engineId: moduleId,
        engineLabel: catalogName(moduleId),
        missionRef,
        brainModule,
        executiveSummary: loaded.executiveSummary,
        nextAction: loaded.nextExecutiveAction,
        available: true,
        orchestrationOnly: true as const,
      };
    } catch {
      return {
        engineId: moduleId,
        engineLabel: catalogName(moduleId),
        missionRef,
        brainModule,
        executiveSummary: `${catalogName(moduleId)} feed unavailable`,
        nextAction: "Restore engine telemetry",
        available: false,
        orchestrationOnly: true as const,
      };
    }
  });
}

function buildConsumerDeliveries(
  unified: Pick<
    ExecutiveIntelligenceUnifiedService,
    "aggregatedSummary" | "decisionSnapshot" | "enginesAvailable" | "coordinatedEngineCount"
  >,
  coordinated: CoordinatedEngineStatus[],
): ExecutiveIntelligenceConsumerDelivery[] {
  const decision = unified.decisionSnapshot;
  const riskEngine = coordinated.find((e) => e.engineId === "risk-intelligence");

  return [
    {
      consumerId: "cockpit",
      consumerLabel: "Cockpit",
      deliveryMode: "full-suite",
      payloadSummary: unified.aggregatedSummary,
      recommendedAction: decision.executiveRecommendation,
      bridgeModule: "executive-intelligence-orchestrator",
      orchestrationOnly: true,
    },
    {
      consumerId: "pillow",
      consumerLabel: "Pillow",
      deliveryMode: "decision-first",
      payloadSummary: `${decision.finalRecommendation} · ${decision.reasoningSummary.slice(0, 120)}`,
      recommendedAction: riskEngine?.nextAction ?? decision.executiveRecommendation,
      bridgeModule: "pillow-supervisor",
      orchestrationOnly: true,
    },
    {
      consumerId: "global-ai-assistant",
      consumerLabel: "Global AI Assistant",
      deliveryMode: "summary-only",
      payloadSummary: unified.aggregatedSummary,
      recommendedAction: decision.executiveRecommendation,
      bridgeModule: "global-assistant",
      orchestrationOnly: true,
    },
    {
      consumerId: "business-automation",
      consumerLabel: "Business Automation",
      deliveryMode: "schedule-manifest",
      payloadSummary: `Decision gate: ${decision.finalRecommendation} · ${unified.enginesAvailable}/${unified.coordinatedEngineCount} engines live`,
      recommendedAction:
        decision.finalRecommendation === "PROCEED" || decision.finalRecommendation === "PROCEED_WITH_CAUTION"
          ? "Eligible for G5 automation trigger evaluation"
          : "Automation held — resolve executive decision first",
      bridgeModule: "business-automation",
      orchestrationOnly: true,
    },
    {
      consumerId: "executive-reports",
      consumerLabel: "Executive Reports",
      deliveryMode: "report-bundle",
      payloadSummary: `${coordinated.filter((e) => e.available).length} engine reports · decision ${decision.finalRecommendation}`,
      recommendedAction: decision.executiveRecommendation,
      bridgeModule: "executive-reports",
      orchestrationOnly: true,
    },
  ];
}

export function buildExecutiveIntelligenceUnifiedService(
  workspaceId: string,
  coordinated: CoordinatedEngineStatus[] = coordinateExecutiveEngines(workspaceId),
): ExecutiveIntelligenceUnifiedService {
  const decisionView = loadDecisionIntelligenceEngineViewForWorkspace(workspaceId);
  const decision = decisionView.decision;
  const available = coordinated.filter((e) => e.available);
  const aggregatedSummary = `Executive Intelligence Suite · ${available.length}/9 engines coordinated · ${decision.finalRecommendation} · confidence ${decision.decisionConfidence}%`;

  const unified: ExecutiveIntelligenceUnifiedService = {
    serviceId: `exec-intel:${workspaceId}`,
    orchestrationPolicy: "no_business_logic",
    coordinatedEngineCount: coordinated.length,
    enginesAvailable: available.length,
    aggregatedSummary,
    decisionSnapshot: {
      finalRecommendation: decision.finalRecommendation,
      decisionConfidence: decision.decisionConfidence,
      executiveRecommendation: decision.executiveRecommendation,
      reasoningSummary: decision.reasoningSummary,
    },
    scheduleSlots: [...G3_10_SCHEDULE_SLOTS],
    consumerDeliveries: [],
    coordinatedEngines: coordinated,
    supportingEvidence: [
      ...decision.supportingEvidence.slice(0, 8).map((e) => ({
        source: e.source,
        label: e.label,
        value: e.value,
      })),
      ...available.slice(0, 4).map((e) => ({
        source: e.engineId,
        label: e.engineLabel,
        value: e.executiveSummary.slice(0, 80),
      })),
    ],
    computedAt: new Date().toISOString(),
  };
  unified.consumerDeliveries = buildConsumerDeliveries(unified, coordinated);
  return unified;
}

export function buildExecutiveIntelligenceOrchestratorArchitecture(): ExecutiveIntelligenceOrchestratorArchitecture {
  return {
    schemaVersion: G3_10_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "executive-intelligence-orchestrator",
    displayName: "Executive Intelligence Orchestrator",
    missionRef: "G3-10",
    scopeGate: "Orchestration only — schedules, coordinates, aggregates · owns no business logic · no live scheduler in G3-10",
    orchestrationPolicy: "no_business_logic",
    suiteEngines: buildExecutiveIntelligenceDiscoveryView(),
    consumerChannels: [...G3_10_CONSUMER_CHANNELS],
    capabilities: [...G3_10_CAPABILITIES],
    dataFlow: G3_10_DATA_FLOW,
    futureExpansion: [
      "Live cron scheduler for hourly/daily intelligence slots",
      "G5 Business Automation webhook on PROCEED decision gate",
      "Pillow approval card auto-populated from orchestrator delivery",
      "Append G3 engine to suite roster via catalog only",
    ],
  };
}

export function loadExecutiveIntelligenceOrchestratorView(
  workspaceId: string,
): ExecutiveIntelligenceOrchestratorView {
  const architecture = buildExecutiveIntelligenceOrchestratorArchitecture();
  const unifiedService = buildExecutiveIntelligenceUnifiedService(workspaceId);

  return {
    architecture,
    unifiedService,
    executiveSummary: unifiedService.aggregatedSummary,
    nextExecutiveAction: unifiedService.decisionSnapshot.executiveRecommendation,
  };
}

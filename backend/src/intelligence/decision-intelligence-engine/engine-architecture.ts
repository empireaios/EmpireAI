/**
 * G3-09 — Decision Intelligence Engine · Architecture Layer
 * Orchestrates executive recommendations from G3-01–G3-08 — never calculates raw data.
 * Architecture only — no live decision pipelines or external API connections in G3-09.
 */

import { INTELLIGENCE_MODULE_CATALOG } from "../../brain/contract/module-ids.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "../../domain/services/product-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";
import { loadQuantitativeIntelligenceEngineViewForWorkspace } from "../../domain/services/quantitative-intelligence-engine-views.js";
import { loadAdvertisingIntelligenceEngineViewForWorkspace } from "../../domain/services/advertising-intelligence-engine-views.js";
import { loadCustomerIntelligenceEngineViewForWorkspace } from "../../domain/services/customer-intelligence-engine-views.js";
import { loadRiskIntelligenceEngineViewForWorkspace } from "../../domain/services/risk-intelligence-engine-views.js";

export const G3_09_SCHEMA_VERSION = "g3-09-v1" as const;

export const G3_09_EXECUTIVE_ENGINE_IDS = [
  "product-intelligence",
  "market-intelligence",
  "supplier-intelligence",
  "financial-intelligence",
  "quantitative-intelligence",
  "advertising-intelligence",
  "customer-intelligence",
  "risk-intelligence",
] as const;

export type G309ExecutiveEngineId = (typeof G3_09_EXECUTIVE_ENGINE_IDS)[number];

export type DecisionFinalRecommendation =
  | "PROCEED"
  | "PROCEED_WITH_CAUTION"
  | "HOLD"
  | "PIVOT"
  | "STOP";

export type DecisionIntelligenceEvidence = {
  source: string;
  label: string;
  value: string;
  href?: string | null;
};

export type DecisionEngineFeed = {
  engineId: G309ExecutiveEngineId;
  engineLabel: string;
  missionRef: string;
  brainModule: string;
  signalSummary: string;
  topRecommendation: string | null;
  recommendedAction: string | null;
  confidence: number;
  evidenceCount: number;
  available: boolean;
  orchestrationOnly: true;
};

/** G3-09 — Orchestrated executive decision contract. No raw data fields. */
export type DecisionIntelligenceContract = {
  decisionId: string;
  finalRecommendation: DecisionFinalRecommendation;
  decisionConfidence: number;
  reasoningSummary: string;
  supportingEvidence: DecisionIntelligenceEvidence[];
  executiveRecommendation: string;
  engineFeeds: DecisionEngineFeed[];
  computedAt: string;
};

export type DecisionIntelligenceCapabilityId = G309ExecutiveEngineId | "decision_synthesis";

export type DecisionIntelligenceCapabilityDefinition = {
  id: DecisionIntelligenceCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "orchestration";
};

export type DecisionIntelligenceEngineIntegration = {
  engineId: G309ExecutiveEngineId;
  label: string;
  relationship: "consumes";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type DecisionDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:decision-orchestration-catalog";
  executiveEngines: Array<{
    moduleId: G309ExecutiveEngineId;
    moduleName: string;
    status: string;
    description: string;
  }>;
};

export type DecisionIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_09_SCHEMA_VERSION;
  computedAt: string;
  engineId: "decision-intelligence-engine";
  displayName: string;
  missionRef: "G3-09";
  scopeGate: string;
  orchestrationPolicy: "never_calculates_raw_data";
  decisionDiscovery: DecisionDiscoveryView;
  capabilities: DecisionIntelligenceCapabilityDefinition[];
  integrations: DecisionIntelligenceEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type DecisionIntelligenceEngineView = {
  architecture: DecisionIntelligenceEngineArchitecture;
  decision: DecisionIntelligenceContract;
  feedsReceived: number;
  feedsAvailable: number;
  executiveSummary: string;
  nextExecutiveAction: string;
};

export const G3_09_CAPABILITIES: readonly DecisionIntelligenceCapabilityDefinition[] = [
  {
    id: "product-intelligence",
    label: "Product Intelligence input",
    description: "Orchestrate PIE executive outputs — no raw product scoring",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "market-intelligence",
    label: "Market Intelligence input",
    description: "Orchestrate MIE ENTER/WATCH/AVOID/EXPAND signals",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "supplier-intelligence",
    label: "Supplier Intelligence input",
    description: "Orchestrate SIE SELL/REVIEW/REJECT supplier signals",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "financial-intelligence",
    label: "Financial Intelligence input",
    description: "Orchestrate FIE INVEST/HOLD/REDUCE/REVIEW scenario signals",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "quantitative-intelligence",
    label: "Quantitative Intelligence input",
    description: "Orchestrate QIE meta-confidence only — mathematics, no executive decisions",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "advertising-intelligence",
    label: "Advertising Intelligence input",
    description: "Orchestrate AIE SCALE/MAINTAIN/PAUSE/TEST campaign signals",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "customer-intelligence",
    label: "Customer Intelligence input",
    description: "Orchestrate CIE RETAIN/ENGAGE/WIN_BACK/MONITOR customer signals",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "risk-intelligence",
    label: "Risk Intelligence input",
    description: "Orchestrate RIE severity and mitigation signals — veto authority",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
  {
    id: "decision_synthesis",
    label: "Decision synthesis",
    description: "Combine engine feeds into final recommendation with confidence and reasoning",
    implementationStatus: "live",
    dataMode: "orchestration",
  },
];

const G3_09_COCKPIT_ROUTES: Record<G309ExecutiveEngineId, string> = {
  "product-intelligence": "/cockpit/intelligence/products",
  "market-intelligence": "/cockpit/intelligence/markets",
  "supplier-intelligence": "/cockpit/intelligence/suppliers",
  "financial-intelligence": "/cockpit/finance/intelligence",
  "quantitative-intelligence": "/cockpit/intelligence/discovery",
  "advertising-intelligence": "/cockpit/commerce/ad-intelligence",
  "customer-intelligence": "/cockpit/intelligence/customers",
  "risk-intelligence": "/cockpit/intelligence/risk",
};

const G3_09_MISSION_REFS: Record<G309ExecutiveEngineId, string> = {
  "product-intelligence": "G3-01",
  "market-intelligence": "G3-02",
  "supplier-intelligence": "G3-03",
  "financial-intelligence": "G3-04",
  "quantitative-intelligence": "G3-05",
  "advertising-intelligence": "G3-06",
  "customer-intelligence": "G3-07",
  "risk-intelligence": "G3-08",
};

export const G3_09_ENGINE_INTEGRATIONS: readonly DecisionIntelligenceEngineIntegration[] =
  G3_09_EXECUTIVE_ENGINE_IDS.map((engineId) => {
    const catalog = INTELLIGENCE_MODULE_CATALOG.find((e) => e.moduleId === engineId);
    return {
      engineId,
      label: catalog?.moduleName ?? engineId,
      relationship: "consumes" as const,
      description: catalog?.description ?? `Orchestrate ${engineId} executive outputs`,
      cockpitRoute: G3_09_COCKPIT_ROUTES[engineId],
      brainModule: `${engineId}-engine`,
    };
  });

export const G3_09_DATA_FLOW: DecisionIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Registry catalog",
    from: "INTELLIGENCE_MODULE_CATALOG → G3-01–G3-08 executive engines",
    to: "Orchestration feed manifest",
    description: "Executive engine roster discovered from Brain contract catalog",
  },
  {
    stage: "2 — Feed collection",
    from: "G3-01–G3-08 engine views",
    to: "DecisionEngineFeed[]",
    description: "Load pre-computed recommendations — no raw data calculation in G3-09",
  },
  {
    stage: "3 — Synthesis",
    from: "Engine feeds + QIE meta-confidence",
    to: "DecisionIntelligenceContract",
    description: "Final recommendation, confidence, reasoning, evidence aggregation",
  },
  {
    stage: "4 — Executive output",
    from: "Decision contract",
    to: "Cockpit SCR-109",
    description: "PROCEED / PROCEED_WITH_CAUTION / HOLD / PIVOT / STOP with executive recommendation",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

type SignalPolarity = "positive" | "neutral" | "negative";

function classifySignal(engineId: G309ExecutiveEngineId, recommendation: string | null): SignalPolarity {
  if (!recommendation) return "neutral";
  const rec = recommendation.toUpperCase();

  if (engineId === "risk-intelligence") {
    if (rec === "CRITICAL" || rec === "HIGH") return "negative";
    if (rec === "LOW") return "positive";
    return "neutral";
  }

  if (engineId === "quantitative-intelligence") return "neutral";

  const positive = [
    "SELL", "ENTER", "EXPAND", "INVEST", "SCALE", "RETAIN", "ENGAGE", "PROCEED",
  ];
  const negative = [
    "DO_NOT_SELL", "REJECT", "AVOID", "REDUCE", "PAUSE", "WIN_BACK", "STOP", "HOLD",
  ];

  if (positive.some((p) => rec.includes(p))) return "positive";
  if (negative.some((p) => rec.includes(p))) return "negative";
  return "neutral";
}

export function buildDecisionIntelligenceDiscoveryView(): DecisionDiscoveryView {
  const executiveEngines = G3_09_EXECUTIVE_ENGINE_IDS.map((moduleId) => {
    const entry = INTELLIGENCE_MODULE_CATALOG.find((e) => e.moduleId === moduleId);
    return {
      moduleId,
      moduleName: entry?.moduleName ?? moduleId,
      status: entry?.status ?? "active",
      description: entry?.description ?? "",
    };
  });

  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:decision-orchestration-catalog",
    executiveEngines,
  };
}

function collectProductFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "product-intelligence" as const,
    engineLabel: "Product Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["product-intelligence"],
    brainModule: "product-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadProductIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topRanked[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topRanked.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "PIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectMarketFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "market-intelligence" as const,
    engineLabel: "Market Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["market-intelligence"],
    brainModule: "market-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadMarketIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topOpportunities[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topOpportunities.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "MIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectSupplierFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "supplier-intelligence" as const,
    engineLabel: "Supplier Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["supplier-intelligence"],
    brainModule: "supplier-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadSupplierIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topRanked[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topRanked.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "SIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectFinancialFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "financial-intelligence" as const,
    engineLabel: "Financial Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["financial-intelligence"],
    brainModule: "financial-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadFinancialIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topOpportunities[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topOpportunities.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "FIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectQuantitativeFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "quantitative-intelligence" as const,
    engineLabel: "Quantitative Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["quantitative-intelligence"],
    brainModule: "quantitative-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadQuantitativeIntelligenceEngineViewForWorkspace(workspaceId);
    const metaModel = view.modelResults.find((r) => r.modelKind === "confidence_modelling");
    const metaConfidence = Number(metaModel?.outputs.metaConfidence ?? 50);
    return {
      ...base,
      signalSummary: view.summary,
      topRecommendation: null,
      recommendedAction: view.nextReviewAction,
      confidence: metaConfidence,
      evidenceCount: view.modelResults.length,
      available: view.modelResults.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "QIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectAdvertisingFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "advertising-intelligence" as const,
    engineLabel: "Advertising Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["advertising-intelligence"],
    brainModule: "advertising-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadAdvertisingIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topPerformers[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topPerformers.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "AIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectCustomerFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "customer-intelligence" as const,
    engineLabel: "Customer Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["customer-intelligence"],
    brainModule: "customer-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadCustomerIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topSegments[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.recommendation ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topSegments.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "CIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

function collectRiskFeed(workspaceId: string): DecisionEngineFeed {
  const base = {
    engineId: "risk-intelligence" as const,
    engineLabel: "Risk Intelligence Engine",
    missionRef: G3_09_MISSION_REFS["risk-intelligence"],
    brainModule: "risk-intelligence-engine",
    orchestrationOnly: true as const,
  };
  try {
    const view = loadRiskIntelligenceEngineViewForWorkspace(workspaceId);
    const top = view.topRisks[0];
    return {
      ...base,
      signalSummary: view.executiveSummary,
      topRecommendation: top?.severity ?? null,
      recommendedAction: top?.recommendedAction ?? view.nextExecutiveAction,
      confidence: top?.confidence ?? 50,
      evidenceCount: top?.supportingEvidence.length ?? 0,
      available: view.topRisks.length > 0,
    };
  } catch {
    return { ...base, signalSummary: "RIE feed unavailable", topRecommendation: null, recommendedAction: null, confidence: 0, evidenceCount: 0, available: false };
  }
}

export function collectExecutiveEngineFeeds(workspaceId: string): DecisionEngineFeed[] {
  return [
    collectProductFeed(workspaceId),
    collectMarketFeed(workspaceId),
    collectSupplierFeed(workspaceId),
    collectFinancialFeed(workspaceId),
    collectQuantitativeFeed(workspaceId),
    collectAdvertisingFeed(workspaceId),
    collectCustomerFeed(workspaceId),
    collectRiskFeed(workspaceId),
  ];
}

function synthesizeFinalRecommendation(
  feeds: DecisionEngineFeed[],
): DecisionFinalRecommendation {
  const available = feeds.filter((f) => f.available);
  if (available.length === 0) return "HOLD";

  const riskFeed = feeds.find((f) => f.engineId === "risk-intelligence");
  const riskRec = riskFeed?.topRecommendation?.toUpperCase() ?? "";
  if (riskRec === "CRITICAL") return "STOP";
  if (riskRec === "HIGH" && available.filter((f) => classifySignal(f.engineId, f.topRecommendation) === "positive").length < 3) {
    return "HOLD";
  }

  let positive = 0;
  let negative = 0;
  for (const feed of available) {
    const polarity = classifySignal(feed.engineId, feed.topRecommendation);
    if (polarity === "positive") positive += 1;
    if (polarity === "negative") negative += 1;
  }

  if (negative >= 4) return "STOP";
  if (negative >= 3 && positive <= 2) return "PIVOT";
  if (positive >= 5 && negative <= 1) return "PROCEED";
  if (positive >= 3 && negative <= 2) return "PROCEED_WITH_CAUTION";
  if (negative > positive) return "HOLD";
  return "PROCEED_WITH_CAUTION";
}

function buildReasoningSummary(feeds: DecisionEngineFeed[], finalRecommendation: DecisionFinalRecommendation): string {
  const available = feeds.filter((f) => f.available);
  const lines = available.map(
    (f) => `${f.engineLabel}: ${f.topRecommendation ?? "math-only"} — ${f.signalSummary.split("·")[0]?.trim()}`,
  );
  return `${available.length}/8 executive engines consulted · ${finalRecommendation} · ${lines.slice(0, 4).join(" · ")}`;
}

function aggregateSupportingEvidence(feeds: DecisionEngineFeed[]): DecisionIntelligenceEvidence[] {
  const evidence: DecisionIntelligenceEvidence[] = [];
  for (const feed of feeds.filter((f) => f.available)) {
    evidence.push({
      source: feed.engineId,
      label: feed.engineLabel,
      value: feed.topRecommendation ?? `confidence ${feed.confidence}`,
    });
    if (feed.recommendedAction) {
      evidence.push({
        source: feed.engineId,
        label: "Recommended action",
        value: feed.recommendedAction.slice(0, 120),
      });
    }
  }
  return evidence.slice(0, 16);
}

function buildExecutiveRecommendation(
  finalRecommendation: DecisionFinalRecommendation,
  feeds: DecisionEngineFeed[],
): string {
  const actions = feeds
    .filter((f) => f.available && f.recommendedAction)
    .slice(0, 3)
    .map((f) => f.recommendedAction!);

  switch (finalRecommendation) {
    case "PROCEED":
      return `Proceed with commercial plan — top actions: ${actions.join("; ") || "activate full G3 stack telemetry"}`;
    case "PROCEED_WITH_CAUTION":
      return `Proceed with caution — validate ${actions[0] ?? "risk mitigations"} before scaling spend`;
    case "HOLD":
      return `Hold expansion — resolve ${feeds.find((f) => f.engineId === "risk-intelligence")?.recommendedAction ?? "open risk items"} first`;
    case "PIVOT":
      return `Pivot strategy — negative signals from ${feeds.filter((f) => classifySignal(f.engineId, f.topRecommendation) === "negative").map((f) => f.engineLabel).slice(0, 2).join(" and ") || "multiple engines"}`;
    case "STOP":
      return `Stop current trajectory — ${feeds.find((f) => f.engineId === "risk-intelligence")?.recommendedAction ?? "critical risk threshold exceeded"}`;
  }
}

export function synthesizeDecisionContract(
  workspaceId: string,
  feeds: DecisionEngineFeed[] = collectExecutiveEngineFeeds(workspaceId),
): DecisionIntelligenceContract {
  const available = feeds.filter((f) => f.available);
  const qieFeed = feeds.find((f) => f.engineId === "quantitative-intelligence");
  const avgConfidence =
    available.length > 0
      ? available.reduce((sum, f) => sum + f.confidence, 0) / available.length
      : 0;
  const qieBoost = qieFeed?.available ? (qieFeed.confidence - 50) * 0.15 : 0;
  const coverageBoost = (available.length / G3_09_EXECUTIVE_ENGINE_IDS.length) * 20;
  const finalRecommendation = synthesizeFinalRecommendation(feeds);
  const decisionConfidence = clampScore(avgConfidence + qieBoost + coverageBoost);

  return {
    decisionId: `decision:${workspaceId}`,
    finalRecommendation,
    decisionConfidence,
    reasoningSummary: buildReasoningSummary(feeds, finalRecommendation),
    supportingEvidence: aggregateSupportingEvidence(feeds),
    executiveRecommendation: buildExecutiveRecommendation(finalRecommendation, feeds),
    engineFeeds: feeds,
    computedAt: new Date().toISOString(),
  };
}

export function buildDecisionIntelligenceEngineArchitecture(): DecisionIntelligenceEngineArchitecture {
  const decisionDiscovery = buildDecisionIntelligenceDiscoveryView();
  return {
    schemaVersion: G3_09_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "decision-intelligence-engine",
    displayName: "Decision Intelligence Engine",
    missionRef: "G3-09",
    scopeGate: "Orchestration only — never calculates raw data · no live decision pipelines in G3-09",
    orchestrationPolicy: "never_calculates_raw_data",
    decisionDiscovery,
    capabilities: [...G3_09_CAPABILITIES],
    integrations: [...G3_09_ENGINE_INTEGRATIONS],
    dataFlow: G3_09_DATA_FLOW,
    futureExpansion: [
      "Weighted engine veto rules from REG decision policy rows",
      "King approval gate integration for STOP recommendations",
      "Append executive engine to catalog without G3-09 code change",
    ],
  };
}

export function loadDecisionIntelligenceEngineView(workspaceId: string): DecisionIntelligenceEngineView {
  const architecture = buildDecisionIntelligenceEngineArchitecture();
  const feeds = collectExecutiveEngineFeeds(workspaceId);
  const decision = synthesizeDecisionContract(workspaceId, feeds);
  const feedsAvailable = feeds.filter((f) => f.available).length;

  return {
    architecture,
    decision,
    feedsReceived: feeds.length,
    feedsAvailable,
    executiveSummary: `${feedsAvailable}/8 executive engines orchestrated · ${decision.finalRecommendation} · confidence ${decision.decisionConfidence}%`,
    nextExecutiveAction: decision.executiveRecommendation,
  };
}

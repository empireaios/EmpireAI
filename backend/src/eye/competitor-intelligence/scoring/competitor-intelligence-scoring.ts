import { randomUUID } from "node:crypto";

import {
  CompetitorWatchConnector,
  createCompetitorWatchConnector,
} from "../../connectors/competitor-watch/competitor-watch-connector.js";
import type { EyeConnectorContext } from "../../types.js";
import {
  detectChanges,
  generateAlertsFromChanges,
} from "../engines/competitor-change-detection-engine.js";
import { mapObservationToSnapshot } from "../mappers/competitor-snapshot-mapper.js";
import type { CompetitorAlert } from "../models/competitor-alert.js";
import type { CompetitorChange } from "../models/competitor-change.js";
import type { CompetitorIntelligenceReportCreateInput } from "../models/competitor-intelligence-report.js";
import type {
  CompetitorIntelligenceSignal,
  CompetitorIntelligenceSignalType,
} from "../models/competitor-intelligence-signal.js";
import type { CompetitorProfile } from "../models/competitor-profile.js";
import type { CompetitorSnapshot } from "../models/competitor-snapshot.js";

export const COMPETITOR_INTELLIGENCE_SIGNAL_WEIGHTS: Record<
  CompetitorIntelligenceSignalType,
  number
> = {
  competitor_coverage: 0.14,
  price_tracking: 0.14,
  creative_tracking: 0.12,
  landing_page_tracking: 0.12,
  offer_tracking: 0.12,
  review_tracking: 0.12,
  bestseller_tracking: 0.12,
  alert_quality: 0.1,
  competitor_composite: 0.02,
};

export type CompetitorIntelligenceBrandInput = {
  brandId: string;
  brandName: string;
  niche: string;
  confidence: number;
};

export type CompetitorIntelligenceInput = {
  brand: CompetitorIntelligenceBrandInput;
  storeId: string;
  competitors?: Array<{
    competitorName: string;
    competitorDomain: string;
    marketplace?: string;
    category?: string;
  }>;
  watchCycle?: number;
  previousSnapshots?: CompetitorSnapshot[];
};

export type CompetitorIntelligenceBreakdown = CompetitorIntelligenceReportCreateInput;

function clampScore(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function buildSignal(
  signalType: CompetitorIntelligenceSignalType,
  score: number,
  detail: string,
): CompetitorIntelligenceSignal {
  return {
    signalType,
    score: clampScore(score),
    weight: COMPETITOR_INTELLIGENCE_SIGNAL_WEIGHTS[signalType],
    detail,
  };
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

function stableCompetitorId(domain: string): string {
  return `comp-${domain.replace(/[^a-z0-9]/gi, "-").toLowerCase()}`;
}

function buildDefaultCompetitors(input: CompetitorIntelligenceInput): CompetitorProfile[] {
  const defaults = input.competitors ?? [
    {
      competitorName: "BlendMaster Direct",
      competitorDomain: "blendmaster.example",
      marketplace: "DTC",
      category: input.brand.niche,
    },
    {
      competitorName: "KitchenPro Store",
      competitorDomain: "kitchenpro.example",
      marketplace: "Amazon",
      category: input.brand.niche,
    },
    {
      competitorName: "ApplianceHub",
      competitorDomain: "appliancehub.example",
      marketplace: "Shopify",
      category: input.brand.niche,
    },
  ];

  return defaults.map((entry, index) => ({
    competitorId: stableCompetitorId(entry.competitorDomain),
    competitorName: entry.competitorName,
    competitorDomain: entry.competitorDomain,
    marketplace: entry.marketplace ?? "DTC",
    category: entry.category ?? input.brand.niche,
    watchPriority: index + 1,
  }));
}

async function observeCompetitors(
  connector: CompetitorWatchConnector,
  context: EyeConnectorContext,
  competitors: CompetitorProfile[],
  cycle: number,
): Promise<CompetitorSnapshot[]> {
  const snapshots: CompetitorSnapshot[] = [];

  for (const competitor of competitors) {
    const observations = await connector.observe(context, {
      domain: "market",
      query: {
        competitorId: competitor.competitorId,
        competitorName: competitor.competitorName,
        competitorDomain: competitor.competitorDomain,
        category: competitor.category,
        cycle,
      },
    });

    for (const observation of observations) {
      snapshots.push(mapObservationToSnapshot(observation));
    }
  }

  return snapshots;
}

function buildSignals(
  competitors: CompetitorProfile[],
  changes: CompetitorChange[],
  alerts: CompetitorAlert[],
  confidence: number,
): CompetitorIntelligenceSignal[] {
  const changeTypes = new Set(changes.map((change) => change.changeType));

  return [
    buildSignal(
      "competitor_coverage",
      clampScore(competitors.length * 25),
      `${competitors.length} competitors tracked`,
    ),
    buildSignal(
      "price_tracking",
      changeTypes.has("PRICE_CHANGE") ? 85 : 70,
      changeTypes.has("PRICE_CHANGE") ? "Price change detected" : "Price tracking active",
    ),
    buildSignal(
      "creative_tracking",
      changeTypes.has("CREATIVE_CHANGE") ? 82 : 68,
      changeTypes.has("CREATIVE_CHANGE") ? "Creative change detected" : "Creative tracking active",
    ),
    buildSignal(
      "landing_page_tracking",
      changeTypes.has("LANDING_PAGE") ? 80 : 65,
      changeTypes.has("LANDING_PAGE") ? "Landing page change detected" : "Landing page tracking active",
    ),
    buildSignal(
      "offer_tracking",
      changeTypes.has("OFFER") ? 84 : 66,
      changeTypes.has("OFFER") ? "Offer change detected" : "Offer tracking active",
    ),
    buildSignal(
      "review_tracking",
      changeTypes.has("REVIEW") ? 78 : 64,
      changeTypes.has("REVIEW") ? "Review change detected" : "Review tracking active",
    ),
    buildSignal(
      "bestseller_tracking",
      changeTypes.has("BEST_SELLER") ? 80 : 62,
      changeTypes.has("BEST_SELLER") ? "Bestseller rank change detected" : "Bestseller tracking active",
    ),
    buildSignal(
      "alert_quality",
      alerts.length > 0 ? clampScore(70 + alerts.length * 5) : 55,
      `${alerts.length} alerts generated`,
    ),
    buildSignal("competitor_composite", confidence, `Competitor intelligence confidence ${confidence}`),
  ];
}

function computeConfidence(signals: CompetitorIntelligenceSignal[]): number {
  const weighted = signals
    .filter((signal) => signal.signalType !== "competitor_composite")
    .reduce((total, signal) => total + signal.score * signal.weight, 0);

  const weightSum = signals
    .filter((signal) => signal.signalType !== "competitor_composite")
    .reduce((total, signal) => total + signal.weight, 0);

  return clampScore(weightSum > 0 ? weighted / weightSum : 0);
}

/** Runs competitor watch cycle and generates intelligence report — mock only, no live API. */
export async function runCompetitorWatchCycle(
  workspaceId: string,
  input: CompetitorIntelligenceInput,
  connector: CompetitorWatchConnector = createCompetitorWatchConnector(),
): Promise<CompetitorIntelligenceBreakdown> {
  const competitors = buildDefaultCompetitors(input);
  const cycle = input.watchCycle ?? 1;
  const context: EyeConnectorContext = {
    workspaceId,
    correlationId: randomUUID(),
  };

  await connector.connect(context);
  const snapshots = await observeCompetitors(connector, context, competitors, cycle);

  const previousByCompetitor = new Map(
    (input.previousSnapshots ?? []).map((snapshot) => [snapshot.competitorId, snapshot]),
  );

  const changes: CompetitorChange[] = [];
  for (const snapshot of snapshots) {
    const previous = previousByCompetitor.get(snapshot.competitorId) ?? null;
    changes.push(...detectChanges(previous, snapshot));
  }

  const alerts = generateAlertsFromChanges(changes);

  const provisionalSignals = buildSignals(competitors, changes, alerts, 0);
  const confidence = computeConfidence(provisionalSignals);
  const signals = buildSignals(competitors, changes, alerts, confidence);

  return {
    storeId: input.storeId,
    brandId: input.brand.brandId,
    reportName: `${input.brand.brandName} Competitor Intelligence`,
    competitors,
    snapshots,
    changes,
    alerts,
    confidence,
    signals,
    intelligenceOnly: true,
    liveApiEnabled: false,
  };
}

/** Generates first-cycle competitor intelligence (baseline snapshots, no changes). */
export async function generateCompetitorIntelligence(
  workspaceId: string,
  input: CompetitorIntelligenceInput,
): Promise<CompetitorIntelligenceBreakdown> {
  return runCompetitorWatchCycle(workspaceId, { ...input, watchCycle: 1 });
}

export const competitorIntelligenceScoring = {
  runCompetitorWatchCycle,
  generateCompetitorIntelligence,
  computeConfidence,
  COMPETITOR_INTELLIGENCE_SIGNAL_WEIGHTS,
};

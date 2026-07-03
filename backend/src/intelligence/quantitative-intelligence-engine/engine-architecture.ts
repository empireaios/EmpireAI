/**
 * G3-05 — Quantitative Intelligence Engine · Architecture Layer
 * Mathematical reasoning engine — statistics, forecasting, probability, simulation.
 * Does not make executive decisions. Architecture only — no live data pipelines in G3-05.
 */

import {
  buildMarketIntelligenceDiscoveryView,
  getRegistryLoader,
} from "../../registry/index.js";
import { REG_SCORING_POLICY } from "../../registry/types/registry-ids.js";
import { loadProductIntelligenceEngineViewForWorkspace } from "../../domain/services/product-intelligence-engine-views.js";
import { loadMarketIntelligenceEngineViewForWorkspace } from "../../domain/services/market-intelligence-engine-views.js";
import { loadSupplierIntelligenceEngineViewForWorkspace } from "../../domain/services/supplier-intelligence-engine-views.js";
import { loadFinancialIntelligenceEngineViewForWorkspace } from "../../domain/services/financial-intelligence-engine-views.js";

export const G3_05_SCHEMA_VERSION = "g3-05-v1" as const;

export type QuantitativeEvidence = {
  source: string;
  label: string;
  value: string;
};

/** G3-05 — Every quantitative result exposes this contract. No executive decision field. */
export type QuantitativeModelResultContract = {
  resultId: string;
  model: string;
  modelKind: QuantitativeCapabilityId;
  inputs: Record<string, number | string | boolean>;
  outputs: Record<string, number | string>;
  confidence: number;
  supportingEvidence: QuantitativeEvidence[];
  computedAt: string;
};

export type QuantitativeCapabilityId =
  | "statistical_modelling"
  | "predictive_modelling"
  | "forecasting"
  | "probability"
  | "optimisation"
  | "sensitivity_analysis"
  | "simulation"
  | "confidence_modelling";

export type QuantitativeCapabilityDefinition = {
  id: QuantitativeCapabilityId;
  label: string;
  description: string;
  implementationStatus: "live" | "partial" | "architecture";
  dataMode: "mock" | "domain-store" | "registry" | "derived";
};

export type QuantitativeEngineIntegrationId =
  | "product-intelligence-engine"
  | "market-intelligence-engine"
  | "supplier-intelligence-engine"
  | "financial-intelligence-engine";

export type QuantitativeEngineIntegration = {
  engineId: QuantitativeEngineIntegrationId;
  label: string;
  relationship: "feeds";
  description: string;
  cockpitRoute: string;
  brainModule: string;
};

export type QuantitativeDiscoveryView = {
  computedAt: string;
  registrySource: "RegistryLoader:quantitative-discovery-composite";
  scoringPolicyRows: unknown[];
  discoveryChannelCount: number;
  discoveryCountryCount: number;
};

export type QuantitativeIntelligenceEngineArchitecture = {
  schemaVersion: typeof G3_05_SCHEMA_VERSION;
  computedAt: string;
  engineId: "quantitative-intelligence-engine";
  displayName: string;
  missionRef: "G3-05";
  scopeGate: string;
  decisionPolicy: "mathematics_only_no_executive_decisions";
  quantitativeDiscovery: QuantitativeDiscoveryView;
  capabilities: QuantitativeCapabilityDefinition[];
  integrations: QuantitativeEngineIntegration[];
  dataFlow: Array<{ stage: string; from: string; to: string; description: string }>;
  futureExpansion: string[];
};

export type QuantitativeIntelligenceEngineView = {
  architecture: QuantitativeIntelligenceEngineArchitecture;
  modelResults: QuantitativeModelResultContract[];
  summary: string;
  nextReviewAction: string;
};

export const G3_05_CAPABILITIES: readonly QuantitativeCapabilityDefinition[] = [
  {
    id: "statistical_modelling",
    label: "Statistical modelling",
    description: "Mean, median, standard deviation, and sample size over intelligence score populations",
    implementationStatus: "live",
    dataMode: "derived",
  },
  {
    id: "predictive_modelling",
    label: "Predictive modelling",
    description: "Linear trend slope over ranked product intelligence scores",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "forecasting",
    label: "Forecasting",
    description: "One-step forward projection of composite intelligence index",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "probability",
    label: "Probability",
    description: "Empirical probability of scores exceeding registry-derived thresholds",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "optimisation",
    label: "Optimisation",
    description: "Score-weight normalisation — mathematical weights only, no launch decisions",
    implementationStatus: "architecture",
    dataMode: "derived",
  },
  {
    id: "sensitivity_analysis",
    label: "Sensitivity analysis",
    description: "Output delta under ±10% margin input perturbation",
    implementationStatus: "partial",
    dataMode: "derived",
  },
  {
    id: "simulation",
    label: "Simulation",
    description: "Deterministic Monte Carlo draw over composite opportunity index",
    implementationStatus: "architecture",
    dataMode: "derived",
  },
  {
    id: "confidence_modelling",
    label: "Confidence modelling",
    description: "Meta-confidence aggregate from upstream G3 engine contracts",
    implementationStatus: "live",
    dataMode: "derived",
  },
];

export const G3_05_ENGINE_INTEGRATIONS: readonly QuantitativeEngineIntegration[] = [
  {
    engineId: "product-intelligence-engine",
    label: "Product Intelligence Engine",
    relationship: "feeds",
    description: "Product score population for statistics, probability, and optimisation inputs",
    cockpitRoute: "/cockpit/intelligence/products",
    brainModule: "product-intelligence-engine",
  },
  {
    engineId: "market-intelligence-engine",
    label: "Market Intelligence Engine",
    relationship: "feeds",
    description: "Market opportunity scores for composite index and sensitivity inputs",
    cockpitRoute: "/cockpit/intelligence/markets",
    brainModule: "market-intelligence-engine",
  },
  {
    engineId: "supplier-intelligence-engine",
    label: "Supplier Intelligence Engine",
    relationship: "feeds",
    description: "Supplier trust scores for composite confidence and simulation inputs",
    cockpitRoute: "/cockpit/intelligence/suppliers",
    brainModule: "supplier-intelligence-engine",
  },
  {
    engineId: "financial-intelligence-engine",
    label: "Financial Intelligence Engine",
    relationship: "feeds",
    description: "Financial scenario scores for forecasting and sensitivity inputs",
    cockpitRoute: "/cockpit/finance/intelligence",
    brainModule: "financial-intelligence-engine",
  },
];

export const G3_05_DATA_FLOW: QuantitativeIntelligenceEngineArchitecture["dataFlow"] = [
  {
    stage: "1 — Input aggregation",
    from: "G3-01 · G3-02 · G3-03 · G3-04 engine views",
    to: "Quantitative input plane",
    description: "Scores and confidences consumed as mathematical inputs only",
  },
  {
    stage: "2 — Registry scope",
    from: "RegistryLoader → scoring policy + discovery snapshot",
    to: "Model universe bounds",
    description: "Channel and country counts bound simulation and probability scope",
  },
  {
    stage: "3 — Computation",
    from: "Input plane + registry bounds",
    to: "QuantitativeModelResultContract",
    description: "Eight mathematical models — statistics through confidence meta-model",
  },
  {
    stage: "4 — Output",
    from: "Model results",
    to: "Cockpit SCR-102 + downstream executive engines",
    description: "Model · Inputs · Outputs · Confidence · Evidence — no executive decisions",
  },
];

function clampScore(value: number): number {
  return Math.round(Math.max(0, Math.min(100, value)));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const m = mean(values);
  const variance = values.reduce((sum, v) => sum + (v - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

function hashWorkspaceId(workspaceId: string): number {
  let hash = 0;
  for (let i = 0; i < workspaceId.length; i += 1) {
    hash = (hash << 5) - hash + workspaceId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

export function buildQuantitativeDiscoveryView(): QuantitativeDiscoveryView {
  const discovery = buildMarketIntelligenceDiscoveryView({});
  const scoringPolicyRows = getRegistryLoader().resolve({}, REG_SCORING_POLICY).rows;
  return {
    computedAt: new Date().toISOString(),
    registrySource: "RegistryLoader:quantitative-discovery-composite",
    scoringPolicyRows,
    discoveryChannelCount: discovery.intelligenceSources.length,
    discoveryCountryCount: discovery.countries.length,
  };
}

type AggregatedInputs = {
  productScores: number[];
  productConfidences: number[];
  productMargins: number[];
  marketOpportunityScores: number[];
  supplierScores: number[];
  financialScores: number[];
  allConfidences: number[];
  compositeIndex: number;
};

function aggregateInputs(workspaceId: string): AggregatedInputs {
  const pie = loadProductIntelligenceEngineViewForWorkspace(workspaceId);
  const mie = loadMarketIntelligenceEngineViewForWorkspace(workspaceId);
  const sie = loadSupplierIntelligenceEngineViewForWorkspace(workspaceId);
  const fie = loadFinancialIntelligenceEngineViewForWorkspace(workspaceId);

  const productScores = pie.analysedProducts.map((p) => p.intelligenceScore);
  const productConfidences = pie.analysedProducts.map((p) => p.confidence);
  const productMargins = pie.analysedProducts.map((p) => p.profitScore);
  const marketOpportunityScores = mie.analysedMarkets.map((m) => m.opportunityScore);
  const supplierScores = sie.analysedSuppliers.map((s) => s.supplierScore);
  const financialScores = fie.analysedScenarios.map((s) => s.financialScore);
  const allConfidences = [
    ...productConfidences,
    ...mie.analysedMarkets.map((m) => m.confidence),
    ...sie.analysedSuppliers.map((s) => s.confidence),
    ...fie.analysedScenarios.map((s) => s.confidence),
  ];

  const pools = [productScores, marketOpportunityScores, supplierScores, financialScores].filter(
    (p) => p.length > 0,
  );
  const compositeIndex =
    pools.length > 0 ? mean(pools.flat()) : 0;

  return {
    productScores,
    productConfidences,
    productMargins,
    marketOpportunityScores,
    supplierScores,
    financialScores,
    allConfidences,
    compositeIndex,
  };
}

function runStatisticalModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const scores = inputs.productScores.length > 0 ? inputs.productScores : [inputs.compositeIndex];
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:statistical-modelling",
    model: "ProductScoreDistribution v1",
    modelKind: "statistical_modelling",
    inputs: { sampleSize: scores.length, population: "product_intelligence_scores" },
    outputs: {
      mean: Number(mean(scores).toFixed(2)),
      median: Number(median(scores).toFixed(2)),
      stdDev: Number(stdDev(scores).toFixed(2)),
      min: scores.length > 0 ? Math.min(...scores) : 0,
      max: scores.length > 0 ? Math.max(...scores) : 0,
    },
    confidence: clampScore(scores.length >= 5 ? 82 : scores.length >= 1 ? 55 : 30),
    supportingEvidence: [
      { source: "pie", label: "Sample size", value: String(scores.length) },
      { source: "registry", label: "Scoring policy rows", value: String(buildQuantitativeDiscoveryView().scoringPolicyRows.length) },
    ],
    computedAt,
  };
}

function runPredictiveModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const scores = inputs.productScores;
  const n = scores.length;
  let slope = 0;
  if (n >= 2) {
    const xs = scores.map((_, i) => i);
    const xMean = mean(xs);
    const yMean = mean(scores);
    const num = xs.reduce((sum, x, i) => sum + (x - xMean) * (scores[i]! - yMean), 0);
    const den = xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0);
    slope = den > 0 ? num / den : 0;
  }
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:predictive-modelling",
    model: "LinearRankTrend v1",
    modelKind: "predictive_modelling",
    inputs: { sampleSize: n, xAxis: "catalog_rank_index", yAxis: "intelligence_score" },
    outputs: {
      slope: Number(slope.toFixed(4)),
      intercept: Number((mean(scores) - slope * mean(scores.map((_, i) => i))).toFixed(2)),
      trendDirection: slope > 0.5 ? "positive" : slope < -0.5 ? "negative" : "flat",
    },
    confidence: clampScore(n >= 8 ? 75 : n >= 3 ? 52 : 35),
    supportingEvidence: [
      { source: "pie", label: "Ranked products", value: String(n) },
      { source: "model", label: "Method", value: "ordinary_least_squares_rank_index" },
    ],
    computedAt,
  };
}

function runForecastModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const current = inputs.compositeIndex;
  const trend = inputs.productScores.length >= 2
    ? mean(inputs.productScores.slice(-3)) - mean(inputs.productScores.slice(0, 3))
    : 0;
  const forecast = clampScore(current + trend * 0.5);
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:forecasting",
    model: "CompositeIndexForecast v1",
    modelKind: "forecasting",
    inputs: { currentCompositeIndex: Number(current.toFixed(2)), trendDelta: Number(trend.toFixed(2)) },
    outputs: {
      forecastPeriods: 1,
      forecastCompositeIndex: forecast,
      deltaFromCurrent: Number((forecast - current).toFixed(2)),
    },
    confidence: clampScore(inputs.productScores.length >= 3 ? 68 : 42),
    supportingEvidence: [
      { source: "derived", label: "Input engines", value: "PIE+MIE+SIE+FIE composite" },
    ],
    computedAt,
  };
}

function runProbabilityModel(inputs: AggregatedInputs, threshold = 70): QuantitativeModelResultContract {
  const scores = inputs.productScores.length > 0 ? inputs.productScores : inputs.marketOpportunityScores;
  const above = scores.filter((s) => s >= threshold).length;
  const probability = scores.length > 0 ? above / scores.length : 0;
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:probability",
    model: "EmpiricalThresholdProbability v1",
    modelKind: "probability",
    inputs: { threshold, sampleSize: scores.length, scorePopulation: inputs.productScores.length > 0 ? "products" : "markets" },
    outputs: {
      probabilityAboveThreshold: Number(probability.toFixed(4)),
      countAboveThreshold: above,
      percentage: Number((probability * 100).toFixed(1)),
    },
    confidence: clampScore(scores.length >= 10 ? 80 : scores.length >= 3 ? 58 : 35),
    supportingEvidence: [
      { source: "registry", label: "Threshold source", value: `REG-SCORING-POLICY proxy ${threshold}` },
    ],
    computedAt,
  };
}

function runOptimisationModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const scores = inputs.productScores;
  const total = scores.reduce((a, b) => a + b, 0);
  const weights = scores.map((s) => (total > 0 ? Number((s / total).toFixed(4)) : 0));
  const topIndex = scores.length > 0 ? scores.indexOf(Math.max(...scores)) : -1;
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:optimisation",
    model: "ScoreWeightNormalisation v1",
    modelKind: "optimisation",
    inputs: { assetCount: scores.length, objective: "maximise_weighted_score_sum_normalised" },
    outputs: {
      optimalWeights: weights.slice(0, 5).join(", "),
      topWeightIndex: topIndex,
      maxWeight: weights.length > 0 ? Math.max(...weights) : 0,
      note: "Mathematical weights only — executive engines apply decisions",
    },
    confidence: clampScore(scores.length >= 4 ? 70 : 40),
    supportingEvidence: [
      { source: "model", label: "Constraint", value: "weights_sum_to_1" },
    ],
    computedAt,
  };
}

function runSensitivityModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const baseMargin = mean(inputs.productMargins.length > 0 ? inputs.productMargins : [50]);
  const baseIndex = inputs.compositeIndex;
  const perturbedHigh = baseMargin * 1.1;
  const perturbedLow = baseMargin * 0.9;
  const indexHigh = baseIndex * (perturbedHigh / Math.max(baseMargin, 1));
  const indexLow = baseIndex * (perturbedLow / Math.max(baseMargin, 1));
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:sensitivity-analysis",
    model: "MarginPerturbationSensitivity v1",
    modelKind: "sensitivity_analysis",
    inputs: {
      baseMargin: Number(baseMargin.toFixed(2)),
      perturbationPct: 10,
      baseCompositeIndex: Number(baseIndex.toFixed(2)),
    },
    outputs: {
      compositeIndexAtPlus10PctMargin: Number(indexHigh.toFixed(2)),
      compositeIndexAtMinus10PctMargin: Number(indexLow.toFixed(2)),
      sensitivityDelta: Number((indexHigh - indexLow).toFixed(2)),
    },
    confidence: clampScore(inputs.productMargins.length >= 2 ? 72 : 45),
    supportingEvidence: [
      { source: "pie", label: "Margin samples", value: String(inputs.productMargins.length) },
    ],
    computedAt,
  };
}

function runSimulationModel(inputs: AggregatedInputs, workspaceId: string): QuantitativeModelResultContract {
  const rng = seededRandom(hashWorkspaceId(workspaceId));
  const draws = 200;
  const base = inputs.compositeIndex;
  const spread = stdDev(inputs.productScores.length > 0 ? inputs.productScores : [base]) || 8;
  let sum = 0;
  let aboveMedian = 0;
  for (let i = 0; i < draws; i += 1) {
    const draw = clampScore(base + (rng() - 0.5) * 2 * spread);
    sum += draw;
    if (draw >= base) aboveMedian += 1;
  }
  const simulatedMean = sum / draws;
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:simulation",
    model: "DeterministicMonteCarlo v1",
    modelKind: "simulation",
    inputs: {
      draws,
      seed: hashWorkspaceId(workspaceId),
      baseCompositeIndex: Number(base.toFixed(2)),
      spread: Number(spread.toFixed(2)),
    },
    outputs: {
      simulatedMean: Number(simulatedMean.toFixed(2)),
      pAboveBase: Number((aboveMedian / draws).toFixed(4)),
      drawCount: draws,
    },
    confidence: clampScore(65),
    supportingEvidence: [
      { source: "model", label: "RNG", value: "deterministic_lcg_seeded" },
      { source: "registry", label: "Discovery channels", value: String(buildQuantitativeDiscoveryView().discoveryChannelCount) },
    ],
    computedAt,
  };
}

function runConfidenceModel(inputs: AggregatedInputs): QuantitativeModelResultContract {
  const meta = mean(inputs.allConfidences.length > 0 ? inputs.allConfidences : [50]);
  const variance = stdDev(inputs.allConfidences);
  const computedAt = new Date().toISOString();
  return {
    resultId: "qie:confidence-modelling",
    model: "UpstreamMetaConfidence v1",
    modelKind: "confidence_modelling",
    inputs: {
      upstreamConfidenceSamples: inputs.allConfidences.length,
      engines: "PIE,MIE,SIE,FIE",
    },
    outputs: {
      metaConfidence: clampScore(meta),
      confidenceStdDev: Number(variance.toFixed(2)),
      minUpstreamConfidence: inputs.allConfidences.length > 0 ? Math.min(...inputs.allConfidences) : 0,
      maxUpstreamConfidence: inputs.allConfidences.length > 0 ? Math.max(...inputs.allConfidences) : 0,
    },
    confidence: clampScore(inputs.allConfidences.length >= 8 ? 85 : 50),
    supportingEvidence: [
      { source: "g3-engines", label: "Confidence inputs", value: String(inputs.allConfidences.length) },
    ],
    computedAt,
  };
}

export function buildQuantitativeIntelligenceEngineArchitecture(): QuantitativeIntelligenceEngineArchitecture {
  return {
    schemaVersion: G3_05_SCHEMA_VERSION,
    computedAt: new Date().toISOString(),
    engineId: "quantitative-intelligence-engine",
    displayName: "Quantitative Intelligence Engine",
    missionRef: "G3-05",
    scopeGate: "Mathematics only — no executive decisions · no live data pipelines in G3-05",
    decisionPolicy: "mathematics_only_no_executive_decisions",
    quantitativeDiscovery: buildQuantitativeDiscoveryView(),
    capabilities: [...G3_05_CAPABILITIES],
    integrations: [...G3_05_ENGINE_INTEGRATIONS],
    dataFlow: G3_05_DATA_FLOW,
    futureExpansion: [
      "Bayesian posterior updates from live telemetry",
      "REG-SCORING-POLICY wired rows for threshold derivation",
      "GPU-accelerated simulation batches",
      "Export model artefacts to notebook / Canvas",
      "Generative narrative (explicitly out of G3-05 scope — math only)",
    ],
  };
}

export function loadQuantitativeIntelligenceEngineView(
  workspaceId: string,
): QuantitativeIntelligenceEngineView {
  const inputs = aggregateInputs(workspaceId);
  const modelResults: QuantitativeModelResultContract[] = [
    runStatisticalModel(inputs),
    runPredictiveModel(inputs),
    runForecastModel(inputs),
    runProbabilityModel(inputs),
    runOptimisationModel(inputs),
    runSensitivityModel(inputs),
    runSimulationModel(inputs, workspaceId),
    runConfidenceModel(inputs),
  ];

  return {
    architecture: buildQuantitativeIntelligenceEngineArchitecture(),
    modelResults,
    summary: `${modelResults.length} mathematical models computed · composite index ${inputs.compositeIndex.toFixed(1)} · no executive decisions emitted`,
    nextReviewAction: "Forward model outputs to executive engines — QIE does not decide",
  };
}

/**
 * Three stateful synthetic executive missions (≥12 decisions each).
 * Oracle-backed; target attainment scored separately from decision quality.
 * WAVE_CREDIT=0. SC-01 frozen. No live commerce.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedSyntheticAmazonUsCatalog } from "../src/orchestration/synthetic-commerce/fixtures.ts";
import {
  advanceDay,
  applyDecision,
  createEpisode,
  feasibilityBaseline,
  injectEvent,
  scoreEpisode,
} from "../src/orchestration/synthetic-commerce/operating-episode.ts";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../docs/audits/capability-extraction/EXEC_CAP_CLOSURE_20260917/evidence/STATEFUL_MISSIONS_RESULTS.json",
);

function runMission(cfg) {
  const catalog = seedSyntheticAmazonUsCatalog();
  let s = createEpisode({
    episodeId: cfg.id,
    products: catalog.products,
    limits: cfg.limits,
    startingCashUsd: cfg.startingCashUsd,
  });
  const baseline = feasibilityBaseline(s.products, s.limits);
  const skuA = s.products[0]?.productId;
  const skuB = s.products[1]?.productId;

  for (const step of cfg.steps) {
    if (step.event) s = injectEvent(s, { ...step.event, day: s.day });
    if (step.decision) {
      s = applyDecision(s, {
        day: s.day,
        ...step.decision,
        skuId: step.decision.skuId === "$A" ? skuA : step.decision.skuId === "$B" ? skuB : step.decision.skuId,
      });
    }
    if (step.advance !== false) s = advanceDay(s);
  }

  const score = scoreEpisode(s);
  return {
    id: cfg.id,
    title: cfg.title,
    baseline,
    score,
    decisionCount: s.decisions.length,
    events: s.events.map((e) => e.type),
    lessons: s.lessons,
    blocked: s.blocked,
    birthStatus: s.birthStatus,
    realCommerceAuthorized: s.realCommerceAuthorized,
    targetAttainment: score.targetAttainment,
    decisionQualityOk:
      score.decisionCount >= 12 &&
      score.withinBudget &&
      score.unauthorizedAttempts === 0 &&
      score.lessonsRetained >= 1,
  };
}

const missions = [
  {
    id: "M1_portfolio_allocation",
    title: "Commerce opportunity selection/allocation",
    startingCashUsd: 500,
    limits: {
      targetRealisedNetProfitUsd: 1000,
      maxExperimentCostUsd: 250,
      maxInitialProducts: 20,
      simulatedDays: 30,
    },
    steps: [
      { decision: { kind: "select_portfolio", rationale: "pick eligible SKUs", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$A", amountUsd: 50, rationale: "test A", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$B", amountUsd: 40, rationale: "test B", authorized: true } },
      { event: { type: "demand_spike", skuId: "$A", units: 4 }, decision: { kind: "cut_ads", skuId: "$B", rationale: "A outperforming", authorized: true } },
      { decision: { kind: "reallocate_budget", rationale: "shift to A", authorized: true } },
      { decision: { kind: "pause_sku", skuId: "$B", rationale: "weak", authorized: true } },
      { event: { type: "no_sales", skuId: "$B" }, decision: { kind: "escalate_blocker", rationale: "B demand missing", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$A", amountUsd: 30, rationale: "scale A carefully", authorized: true } },
      { event: { type: "demand_spike", skuId: "$A", units: 5 }, decision: { kind: "retain_lesson", rationale: "Concentrate budget on verified demand SKUs", authorized: true } },
      { decision: { kind: "skip_day", rationale: "observe", authorized: true } },
      { decision: { kind: "raise_price", skuId: "$A", rationale: "probe elasticity", authorized: true } },
      { decision: { kind: "stop_loss", rationale: "target unlikely under remaining days — declare infeasible path", authorized: true } },
    ],
  },
  {
    id: "M2_adverse_fulfilment",
    title: "Adverse fulfilment/refund/cash events",
    startingCashUsd: 400,
    limits: {
      targetRealisedNetProfitUsd: 1000,
      maxExperimentCostUsd: 250,
      maxInitialProducts: 15,
      simulatedDays: 30,
    },
    steps: [
      { decision: { kind: "select_portfolio", rationale: "initial", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$A", amountUsd: 60, rationale: "launch", authorized: true } },
      { event: { type: "delivery_delay", skuId: "$A", extraDays: 5 }, decision: { kind: "escalate_blocker", rationale: "late delivery", authorized: true } },
      { event: { type: "refund_wave", skuId: "$A", refundUsd: 80 }, decision: { kind: "accept_refund_wave", skuId: "$A", rationale: "record loss", authorized: true } },
      { decision: { kind: "cut_ads", skuId: "$A", rationale: "stop bleed", authorized: true } },
      { event: { type: "cancel_burst", skuId: "$A", lostRevenueUsd: 40 }, decision: { kind: "pause_sku", skuId: "$A", rationale: "unstable", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$B", amountUsd: 50, rationale: "pivot", authorized: true } },
      { event: { type: "stockout", skuId: "$B" }, decision: { kind: "escalate_blocker", rationale: "stockout B", authorized: true } },
      { decision: { kind: "reallocate_budget", rationale: "preserve cash", authorized: true } },
      { decision: { kind: "retain_lesson", rationale: "Refund + delay clusters require pause before more ads", authorized: true } },
      { decision: { kind: "close_sku", skuId: "$A", rationale: "retire damaged SKU", authorized: true } },
      { decision: { kind: "stop_loss", rationale: "cash constraint binds", authorized: true } },
    ],
  },
  {
    id: "M3_continuity_delegation",
    title: "Continuity/delegation with new evidence and interruptions",
    startingCashUsd: 450,
    limits: {
      targetRealisedNetProfitUsd: 1000,
      maxExperimentCostUsd: 250,
      maxInitialProducts: 20,
      simulatedDays: 30,
    },
    steps: [
      { decision: { kind: "select_portfolio", rationale: "handoff start", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$A", amountUsd: 35, rationale: "delegate test A", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$B", amountUsd: 35, rationale: "delegate test B", authorized: true } },
      { event: { type: "demand_spike", skuId: "$B", units: 6 }, decision: { kind: "retain_lesson", rationale: "B demand stronger than prior belief", authorized: true } },
      { decision: { kind: "reallocate_budget", rationale: "new evidence favors B", authorized: true } },
      { decision: { kind: "cut_ads", skuId: "$A", rationale: "interrupt A spend", authorized: true } },
      { event: { type: "no_sales", skuId: "$A" }, decision: { kind: "pause_sku", skuId: "$A", rationale: "confirm interrupt", authorized: true } },
      { decision: { kind: "escalate_blocker", rationale: "need King only if raising live authority", authorized: true } },
      { decision: { kind: "skip_day", rationale: "fresh session boundary observe", authorized: true } },
      { event: { type: "refund_wave", skuId: "$B", refundUsd: 25 }, decision: { kind: "accept_refund_wave", skuId: "$B", rationale: "adjust after interruption", authorized: true } },
      { decision: { kind: "allocate_experiment", skuId: "$B", amountUsd: 20, rationale: "bounded retest after refund", authorized: true } },
      { decision: { kind: "stop_loss", rationale: "do not invent profit to hit US$1000", authorized: true } },
    ],
  },
];

// Fix event sku placeholders
function materialize(cfg) {
  const catalog = seedSyntheticAmazonUsCatalog();
  const skuA = catalog.products[0]?.productId;
  const skuB = catalog.products[1]?.productId;
  return {
    ...cfg,
    steps: cfg.steps.map((step) => ({
      ...step,
      event: step.event
        ? {
            ...step.event,
            skuId:
              step.event.skuId === "$A" ? skuA : step.event.skuId === "$B" ? skuB : step.event.skuId,
          }
        : undefined,
    })),
  };
}

const results = missions.map((m) => runMission(materialize(m)));
const out = {
  generatedAt: new Date().toISOString(),
  MISSION: "EXEC_CAP_STATEFUL_MISSIONS",
  WAVE_CREDIT: 0,
  SC01: "FROZEN",
  REAL_COMMERCE: "locked",
  BIRTH: "NOT_BORN",
  missions: results,
  allDecisionQualityOk: results.every((r) => r.decisionQualityOk),
  anyTargetMet: results.some((r) => r.targetAttainment),
  NOTE: "Target attainment is separate from decision quality; missing target with stop_loss is valid.",
};

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ allDecisionQualityOk: out.allDecisionQualityOk, anyTargetMet: out.anyTargetMet, missions: results.map((r) => ({ id: r.id, decisions: r.decisionCount, target: r.targetAttainment, quality: r.decisionQualityOk })) }, null, 2));
process.exit(out.allDecisionQualityOk ? 0 : 1);

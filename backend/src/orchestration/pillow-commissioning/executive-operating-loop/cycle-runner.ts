/**
 * Continuous executive operating cycle:
 * OBSERVE → DIAGNOSE → CRITIQUE → GENERATE ALTERNATIVES → INVESTIGATE →
 * COMPARE → DECIDE → ACT/ESCALATE → MONITOR → LEARN → UPDATE STRATEGY → CONTINUE
 *
 * Tier-0/1 by default. No fake heartbeat. No LLM required for ordinary cycles.
 */

import { randomUUID } from "node:crypto";

import { recordFlightEvent } from "../flight-recorder.js";
import { investigateLogisticsAlternatives } from "./logistics-investigation.js";
import { buildOwnerEscalationPackage } from "./owner-escalation.js";
import { prioritiseWork, selectNextAuthorisedWork } from "./priority-engine.js";
import {
  evaluateCritiqueTriggers,
  fingerprintSituation,
  generateStrategicHypotheses,
} from "./strategic-critique.js";
import {
  getCurrentObjective,
  getLatestExecutiveCycle,
  listOutcomes,
  persistExecutiveCycle,
  persistOutcome,
  setCurrentObjective,
} from "./store.js";
import type {
  CommercialSituation,
  ExecutiveCycleRecord,
  OutcomeRecord,
  StageEvidence,
  WorkAuthority,
} from "./types.js";

function stage(
  name: StageEvidence["stage"],
  tier: StageEvidence["tier"],
  summary: string,
  artifacts: Record<string, unknown> = {},
): StageEvidence {
  return { stage: name, at: new Date().toISOString(), tier, summary, artifacts };
}

function decideDisposition(input: {
  situation: CommercialSituation;
  logisticsTriggered: boolean;
  firedTriggerIds: string[];
}): { disposition: string; rationale: string; authority: WorkAuthority } {
  const s = input.situation;
  const spend = s.gatedSpendRequiredUsd;
  const limit = s.spendAuthorityLimitUsd;
  if (spend != null && limit != null && spend > limit) {
    return {
      disposition: "ESCALATE_FOR_AUTHORITY",
      rationale: `Useful strategy requires gated spend ($${spend}) above authority ($${limit}).`,
      authority: "requires_grand_king",
    };
  }
  if (
    input.firedTriggerIds.includes("demand_unknown_with_positive_prior") &&
    s.pricePremiumPct != null &&
    s.pricePremiumPct >= 50
  ) {
    return {
      disposition: "HOLD_FOR_EVIDENCE",
      rationale:
        "High expected margin / prior APPROVE conflicts with UNKNOWN demand and material price premium.",
      authority: "pillow_autonomous",
    };
  }
  if (s.published && s.orders === 0) {
    return {
      disposition: "INVESTIGATE_OUTCOME",
      rationale:
        "Publication without sales is not economic success — diagnose before declaring task complete.",
      authority: "pillow_autonomous",
    };
  }
  if (
    input.firedTriggerIds.includes("supplier_cost_deterioration")
  ) {
    return {
      disposition: "REASSESS_ECONOMICS",
      rationale: "Supplier cost deterioration requires margin and sourcing reassessment.",
      authority: "pillow_autonomous",
    };
  }
  if (input.logisticsTriggered) {
    return {
      disposition: "INVESTIGATE_LOGISTICS_ALTERNATIVES",
      rationale:
        "Delivery economics/speed are weak — logistics is an optimisable strategic variable.",
      authority: "pillow_autonomous",
    };
  }
  if (s.pricePremiumPct != null && s.pricePremiumPct >= 25) {
    return {
      disposition: "INVESTIGATE_PRICING",
      rationale: "Material competitive price premium requires diagnosis and alternatives.",
      authority: "pillow_autonomous",
    };
  }
  return {
    disposition: "CONTINUE_MONITORING",
    rationale: "No material exception requiring immediate strategic change.",
    authority: "pillow_autonomous",
  };
}

export function runExecutiveOperatingCycle(input: {
  workspaceId: string;
  situation: CommercialSituation;
  mode?: "live" | "sandbox";
  persist?: boolean;
  recordFlight?: boolean;
}): ExecutiveCycleRecord {
  const mode = input.mode ?? "live";
  const persist = input.persist ?? mode === "live";
  const recordFlight = input.recordFlight ?? mode === "live";
  const startedAt = new Date().toISOString();
  const cycleId = randomUUID();
  const stages: StageEvidence[] = [];
  let cheapOperationsUsed = 0;
  const llmCallsUsed = 0;

  const previous = getLatestExecutiveCycle(input.workspaceId);
  const situation: CommercialSituation = {
    ...input.situation,
    previousStateFingerprint:
      input.situation.previousStateFingerprint ?? previous?.stateFingerprint ?? null,
  };

  // OBSERVE
  cheapOperationsUsed += 1;
  const stateFingerprint = fingerprintSituation(situation);
  const objective = getCurrentObjective(input.workspaceId);
  stages.push(
    stage("OBSERVE", "TIER_0", "Observed commercial state and objective persistence", {
      stateFingerprint,
      priorCycleId: previous?.cycleId ?? null,
      currentObjective: objective?.objective ?? null,
      stateChanged: Boolean(
        situation.previousStateFingerprint &&
          situation.previousStateFingerprint !== stateFingerprint,
      ),
    }),
  );

  // DIAGNOSE
  cheapOperationsUsed += 1;
  const triggers = evaluateCritiqueTriggers(situation);
  const fired = triggers.filter((t) => t.fired);
  stages.push(
    stage("DIAGNOSE", "TIER_0", `${fired.length} critique triggers fired`, {
      triggers,
    }),
  );

  // CRITIQUE
  cheapOperationsUsed += 1;
  const critiqueQuestions = [
    "What is preventing us from winning?",
    "Which assumption may be wrong?",
    "What important evidence is missing?",
    "What evidence contradicts my current recommendation?",
    "What investigation can I perform autonomously now?",
    "What genuinely requires Grand King authority?",
  ];
  stages.push(
    stage("CRITIQUE", "TIER_0", "Self-critique questions applied via triggers", {
      critiqueQuestions,
      firedTriggerIds: fired.map((t) => t.id),
    }),
  );

  // GENERATE ALTERNATIVES
  cheapOperationsUsed += 1;
  const hypotheses = generateStrategicHypotheses(situation, triggers);
  stages.push(
    stage(
      "GENERATE_ALTERNATIVES",
      "TIER_0",
      `Generated ${hypotheses.length} strategic hypotheses`,
      { hypotheses },
    ),
  );

  // INVESTIGATE (logistics first-class; cheap structured)
  cheapOperationsUsed += 1;
  const logistics = investigateLogisticsAlternatives(situation);
  stages.push(
    stage(
      "INVESTIGATE",
      "TIER_0",
      logistics.triggered
        ? `Logistics investigation triggered: ${logistics.reason}`
        : "No logistics investigation required from current facts",
      { logistics },
    ),
  );

  // COMPARE
  cheapOperationsUsed += 1;
  const workQueue = prioritiseWork(hypotheses);
  const selectedWork = selectNextAuthorisedWork(workQueue);
  stages.push(
    stage("COMPARE", "TIER_0", "Compared work items by economic priority", {
      queueHead: workQueue.slice(0, 5),
      selectedWork,
    }),
  );

  // DECIDE
  cheapOperationsUsed += 1;
  const decision = decideDisposition({
    situation,
    logisticsTriggered: logistics.triggered,
    firedTriggerIds: fired.map((t) => t.id),
  });
  stages.push(
    stage("DECIDE", "TIER_0", `${decision.disposition}: ${decision.rationale}`, {
      decision,
    }),
  );

  // ACT / ESCALATE
  let escalation = null;
  if (decision.authority === "requires_grand_king") {
    cheapOperationsUsed += 1;
    escalation = buildOwnerEscalationPackage({
      situation,
      hypotheses,
      selectedWork,
      logistics,
      disposition: decision.disposition,
      rationale: decision.rationale,
    });
    stages.push(
      stage("ESCALATE", "TIER_0", "Owner escalation package assembled", { escalation }),
    );
    stages.push(
      stage(
        "ACT_WITHIN_AUTHORITY",
        "TIER_0",
        "Did not cross gated spend; prepared Grand King decision package",
        { acted: false, preparedEscalation: true },
      ),
    );
  } else {
    stages.push(
      stage(
        "ACT_WITHIN_AUTHORITY",
        "TIER_0",
        selectedWork
          ? `Selected autonomous investigation: ${selectedWork.title}`
          : "No autonomous work selected; monitoring only",
        { selectedWork, acted: Boolean(selectedWork) },
      ),
    );
  }

  // MONITOR
  cheapOperationsUsed += 1;
  const openOutcomes = listOutcomes(input.workspaceId).filter((o) => o.status !== "CLOSED");
  stages.push(
    stage("MONITOR", "TIER_0", `Monitoring ${openOutcomes.length} open outcome records`, {
      openOutcomeIds: openOutcomes.map((o) => o.id),
      published: situation.published,
      orders: situation.orders,
      realisedRevenueUsd: situation.realisedRevenueUsd,
    }),
  );

  // LEARN + outcome record
  cheapOperationsUsed += 1;
  const now = new Date().toISOString();
  const outcome: OutcomeRecord = {
    id: randomUUID(),
    workspaceId: input.workspaceId,
    initiativeId: situation.situationId,
    hypothesis: selectedWork?.title ?? decision.disposition,
    expectedResult:
      situation.expectedProfitStatus === "ESTIMATED"
        ? `Estimated profit ${situation.expectedProfitUsd ?? "UNKNOWN"} with viable delivery and demand`
        : "Verified commercial progression",
    actualResult:
      situation.published && situation.orders === 0
        ? "Published but zero sales — economic result not achieved"
        : situation.orders > 0
          ? `Orders=${situation.orders}; revenue=${situation.realisedRevenueUsd}`
          : null,
    variance:
      situation.published && situation.orders === 0
        ? "NEGATIVE — task progress without economic outcome"
        : null,
    diagnosis: decision.rationale,
    nextStrategy: selectedWork?.title ?? decision.disposition,
    lesson:
      situation.published && situation.orders === 0
        ? "Listing completion is not economic success; monitor outcomes, not tasks."
        : logistics.triggered
          ? "Weak cross-border delivery should trigger fulfilment-route investigation, not route fatalism."
          : null,
    lessonConfidence: logistics.triggered || (situation.published && situation.orders === 0)
      ? "medium"
      : null,
    lessonConditions: logistics.triggered
      ? "Applies when transit/delivery economics are materially weak; overturn if closer stock/shipping evidence appears."
      : null,
    status: situation.published ? "MONITORED" : "OPEN",
    createdAt: now,
    updatedAt: now,
  };
  stages.push(
    stage("LEARN", "TIER_0", outcome.lesson ?? "Outcome record opened/updated", {
      outcome,
    }),
  );

  // UPDATE STRATEGY
  stages.push(
    stage("UPDATE_STRATEGY", "TIER_0", `Strategy set to ${decision.disposition}`, {
      disposition: decision.disposition,
      selectedWork,
    }),
  );

  // CONTINUE
  stages.push(
    stage("CONTINUE", "TIER_0", "Cycle complete — executive loop continues on next tick/event", {
      continued: true,
      nextFocus: selectedWork?.title ?? decision.disposition,
    }),
  );

  const completedAt = new Date().toISOString();
  const record: ExecutiveCycleRecord = {
    cycleId,
    workspaceId: input.workspaceId,
    startedAt,
    completedAt,
    mode,
    situation,
    stages,
    hypotheses,
    workQueue,
    selectedWork,
    decision,
    escalation,
    outcomeId: outcome.id,
    stateFingerprint,
    llmCallsUsed,
    cheapOperationsUsed,
    continued: true,
  };

  if (persist) {
    persistExecutiveCycle(record);
    persistOutcome(outcome);
    setCurrentObjective({
      workspaceId: input.workspaceId,
      objective: `Executive loop: ${decision.disposition} for ${situation.productName}`,
      currentInitiativeId: situation.situationId,
      lastCycleId: cycleId,
      lastDisposition: decision.disposition,
      pendingEscalation: Boolean(escalation),
      updatedAt: completedAt,
    });
  }

  if (recordFlight) {
    try {
      recordFlightEvent({
        workspaceId: input.workspaceId,
        eventType: "COMMERCE_CYCLE",
        businessArea: "executive",
        subsystem: "pillow-executive-operating-loop",
        objective: `Executive cycle ${decision.disposition}`,
        analysisSummary: `triggers=${fired.length}; hypotheses=${hypotheses.length}; llm=${llmCallsUsed}; cheapOps=${cheapOperationsUsed}`,
        decision: decision.disposition,
        authority: decision.authority === "requires_grand_king" ? "grand_king" : "pillow",
        result: decision.disposition,
        nextScheduledAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        evidenceConsidered: ["executive-operating-loop"],
        entityRefs: { cycleId },
      });
    } catch {
      /* ledger must not break loop */
    }
  }

  return record;
}

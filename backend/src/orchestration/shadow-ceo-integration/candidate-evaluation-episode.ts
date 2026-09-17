/**
 * Synthetic candidate-evaluation episode — uses ONLY Grand-King-supplied facts.
 * Never seeds demo catalog. Zero financial ledger movement.
 */

import {
  buildObjective,
  completedWithEvidence,
  loadChain,
  openShadowCeoRepository,
  verifyChainIntegrity,
  type SqliteShadowCeoRepository,
} from "../shadow-ceo/index.js";
import { createHash } from "node:crypto";
import {
  buildDecisionCaseState,
  extractCurrentDeliveryDays,
  extractCurrentStockUnits,
  extractNamedCandidateBlocks,
  parseDecisionRules,
  type DecisionCaseState,
} from "../pillow-host/executive-decision-case-state.js";
import {
  assertActionPermitted,
  classifyActionFromTitle,
  type ShadowCeoActionKind,
} from "./action-permit.js";
import {
  assertSameRequestOwnership,
  ownershipBundle,
  type RequestOwnerRecord,
} from "./request-owner.js";
import { MISSION_DEFAULT_MODE } from "../shadow-ceo-authority/index.js";

function nowIso(): string {
  return new Date().toISOString();
}

function stableId(prefix: string, key: string): string {
  const digest = createHash("sha256").update(`${prefix}:${key}`).digest("hex").slice(0, 16);
  return `${prefix}_${digest}`;
}

function extractApproval(body: string): string | null {
  const m = /\bapproval\s*[:=]?\s*(granted|pending|cleared|rejected|denied)\b/i.exec(body);
  return m ? m[1]!.toLowerCase() : null;
}

function extractContribution(body: string): number | null {
  const m =
    /(?:contribution|margin|profit|score)\s*[:=]?\s*(?:US\$|S\$|USD|SGD|\$)?\s*(-?\d+(?:\.\d+)?)/i.exec(
      body,
    );
  return m ? Number(m[1]) : null;
}

/** Drop phantom blocks like "Candidate evaluation" that have no commercial metrics. */
export function filterSuppliedCandidates(
  blocks: Array<{ name: string; body: string }>,
): Array<{ name: string; body: string }> {
  return blocks.filter((b) => {
    if (/^candidate\s+evaluation$/i.test(b.name)) return false;
    if (/^evaluation$/i.test(b.name)) return false;
    const hasMetric =
      extractContribution(b.body) != null ||
      extractCurrentStockUnits(b.body).value != null ||
      extractCurrentDeliveryDays(b.body).value != null ||
      extractApproval(b.body) != null ||
      /\b(?:PASS|FAIL|PENDING|granted|pending)\b/i.test(b.body);
    return hasMetric;
  });
}

export function bindSuppliedProducts(message: string): {
  products: RequestOwnerRecord["suppliedProducts"];
  rules: Record<string, unknown>;
  decision: DecisionCaseState | null;
  reason: string | null;
} {
  const rawBlocks = extractNamedCandidateBlocks(message);
  const blocks = filterSuppliedCandidates(rawBlocks);
  if (blocks.length < 1) {
    return {
      products: [],
      rules: {},
      decision: null,
      reason: "no supplied candidate products with commercial facts",
    };
  }
  const rules = parseDecisionRules(message);
  if (
    rules.contributionMin == null &&
    rules.stockMin == null &&
    rules.deliveryMaxDays == null &&
    !rules.approvalRequired
  ) {
    return {
      products: [],
      rules: rules as unknown as Record<string, unknown>,
      decision: null,
      reason: "no eligibility rules bound from the Grand King instruction",
    };
  }

  // Rebuild decision from filtered blocks by rewriting message sections only — use full message
  // but post-filter decision candidates to supplied names.
  const decision = buildDecisionCaseState(message);
  if (!decision) {
    return {
      products: [],
      rules: rules as unknown as Record<string, unknown>,
      decision: null,
      reason: "decision case could not be built from supplied facts",
    };
  }

  const allowedNames = new Set(blocks.map((b) => b.name.toLowerCase()));
  const candidates = decision.candidates.filter((c) =>
    allowedNames.has(c.displayName.toLowerCase()),
  );
  if (candidates.length < 1) {
    return {
      products: [],
      rules: rules as unknown as Record<string, unknown>,
      decision: null,
      reason: "supplied candidates were lost during gate evaluation",
    };
  }

  const eligibleSet = candidates
    .filter((c) => c.currentlyEligible)
    .map((c) => c.displayName);
  let recommendation = decision.recommendation;
  if (eligibleSet.length === 0) {
    recommendation = {
      status: "DO_NOT_SELECT",
      selectedId: null,
      rationale: "No candidate currently passes every mandatory gate.",
    };
  } else if (eligibleSet.length === 1) {
    recommendation = {
      status: "SELECT",
      selectedId: eligibleSet[0]!,
      rationale: `${eligibleSet[0]} is the sole currently eligible candidate.`,
    };
  }

  const filtered: DecisionCaseState = {
    ...decision,
    candidates,
    eligibleSet,
    recommendation,
  };

  const products = blocks.map((b) => ({
    name: b.name,
    body: b.body,
    contributionUsd: extractContribution(b.body),
    stock: extractCurrentStockUnits(b.body).value,
    deliveryDays: extractCurrentDeliveryDays(b.body).value,
    approval: extractApproval(b.body),
  }));

  return {
    products,
    rules: rules as unknown as Record<string, unknown>,
    decision: filtered,
    reason: null,
  };
}

export function formatEligibleSelectedAnswer(decision: DecisionCaseState): string {
  const eligible =
    decision.eligibleSet.length > 0 ? decision.eligibleSet.join(", ") : "none";
  const selected =
    decision.recommendation.status === "SELECT" && decision.recommendation.selectedId
      ? decision.recommendation.selectedId
      : "none";
  return `Eligible candidates: ${eligible}\nCandidate selected: ${selected}`;
}

export function parseEligibleSelectedContract(message: string): {
  detected: boolean;
  expectedLines: number;
} {
  const t = String(message || "");
  const wants =
    /\bEligible\s+candidates\b/i.test(t) && /\bCandidate\s+selected\b/i.test(t);
  if (!wants) return { detected: false, expectedLines: 0 };
  const exact = /\bexactly\s+(\d+)\s+lines?\b/i.exec(t);
  return { detected: true, expectedLines: exact ? Number(exact[1]) : 2 };
}

export type CandidateEvalEpisodeResult = {
  objectiveId: string;
  requestId: string;
  runId: string;
  correlationId: string;
  message: string;
  decision: DecisionCaseState;
  financialEffect: {
    spendingUsd: 0;
    revenueUsd: 0;
    profitUsd: 0;
    ledgerMoved: false;
  };
  tasksCreated: string[];
  actionsCreated: string[];
};

function rejectIfProhibited(
  owner: RequestOwnerRecord,
  title: string,
  stage: "task_create" | "approve" | "execute" | "financial",
): void {
  const kind = classifyActionFromTitle(title);
  const d = assertActionPermitted(
    kind,
    owner.permittedActions,
    owner.prohibitedActions,
    stage,
  );
  if (!d.allowed) {
    throw new Error(d.reason);
  }
}

/**
 * Persist one synthetic candidate-evaluation episode bound to the request owner.
 * Creates ONLY the permitted evaluation task/action — never fulfilment/spend/demo.
 */
export function runCandidateEvaluationEpisode(input: {
  owner: RequestOwnerRecord;
  decision: DecisionCaseState;
  dbPath?: string;
}): CandidateEvalEpisodeResult {
  const { owner, decision } = input;
  const own = ownershipBundle(owner);

  // Pre-flight: only permitted action may proceed.
  rejectIfProhibited(owner, "Synthetic candidate evaluation", "task_create");
  rejectIfProhibited(owner, "Synthetic candidate evaluation", "execute");

  // Financial ledger and demo titles must be rejected before they become records.
  const financialGate = assertActionPermitted(
    "financial_ledger",
    owner.permittedActions,
    owner.prohibitedActions,
    "financial",
  );
  if (financialGate.allowed) {
    throw new Error("FINANCIAL_GATE_FAILED: diagnostic evaluation must forbid ledger movement");
  }
  for (const banned of [
    "Run synthetic fulfilment monitor",
    "Prepare supplier spend request",
    "Supplier spend (blocked — approval required)",
    "Synthetic fulfilment monitor (authorized)",
  ]) {
    const kind = classifyActionFromTitle(banned);
    const d = assertActionPermitted(
      kind,
      owner.permittedActions,
      owner.prohibitedActions,
      "task_create",
    );
    if (d.allowed) {
      throw new Error(`DEMO_ACTION_NOT_ISOLATED: ${banned} would be permitted`);
    }
  }

  const repo: SqliteShadowCeoRepository = openShadowCeoRepository({
    dbPath: input.dbPath,
  });
  const runKey = owner.runId;
  const ts = nowIso();
  const mode = MISSION_DEFAULT_MODE;

  try {
    const objective = repo.upsert(
      buildObjective({
        workspaceId: owner.workspaceId,
        title: "Synthetic candidate evaluation (request-bound)",
        statement: owner.completeInstruction.slice(0, 8000),
        idempotencyKey: `${runKey}:objective`,
        mode,
        source: "synthetic",
        economicClaim: "none",
        completion: completedWithEvidence({
          summary: "Objective admitted for supplied-fact candidate evaluation only",
          artifacts: { ...own, operation: "synthetic_candidate_evaluation" },
          capturedAt: ts,
        }),
      }),
    );
    assertSameRequestOwnership(owner, own, "objective");

    const gateLines = decision.candidates.map((c) => {
      const gates = c.gates.map((g) => `${g.id}=${g.status}`).join(",");
      return `${c.displayName}: ${c.currentlyEligible ? "ELIGIBLE" : "INELIGIBLE"} [${gates}]`;
    });

    const assessment = repo.upsert({
      kind: "assessment",
      id: stableId("asm", `${runKey}:assessment`),
      idempotencyKey: `${runKey}:assessment`,
      objectiveId: objective.id,
      source: "synthetic" as const,
      mode,
      situationSummary: `Bound ${decision.candidates.length} Grand-King-supplied candidates; demo catalog not consulted.`,
      findings: gateLines,
      risks: ["Real commerce locked", "Demo catalog isolated from this request"],
      opportunities: [
        decision.eligibleSet.length === 1
          ? `Sole eligible: ${decision.eligibleSet[0]}`
          : decision.eligibleSet.length === 0
            ? "No eligible candidates under supplied rules"
            : `Eligible set: ${decision.eligibleSet.join(", ")}`,
      ],
      completion: completedWithEvidence({
        summary: "Assessment from supplied products and rules only",
        artifacts: {
          ...own,
          productNames: decision.candidates.map((c) => c.displayName),
          demoCatalogUsed: false,
        },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const priority = repo.upsert({
      kind: "priority_decision",
      id: stableId("pri", `${runKey}:priority:1`),
      idempotencyKey: `${runKey}:priority:1`,
      objectiveId: objective.id,
      assessmentId: assessment.id,
      source: "synthetic" as const,
      mode,
      rank: 1,
      title: "Evaluate supplied candidates under supplied rules",
      rationale: "Grand King supplied products and eligibility gates control this episode",
      urgency: 1,
      economicUpside: null,
      requiredAuthority: "shadow_autonomous" as const,
      completion: completedWithEvidence({
        summary: "Priority ranked for candidate evaluation only",
        artifacts: { ...own, rank: 1 },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const disposition =
      decision.recommendation.status === "SELECT"
        ? `SELECT_${String(decision.recommendation.selectedId).toUpperCase()}`
        : "DO_NOT_SELECT";

    const decisionRec = repo.upsert({
      kind: "executive_decision",
      id: stableId("dec", `${runKey}:decision`),
      idempotencyKey: `${runKey}:decision`,
      objectiveId: objective.id,
      assessmentId: assessment.id,
      priorityIds: [priority.id],
      source: "synthetic" as const,
      mode,
      disposition,
      rationale: decision.recommendation.rationale,
      authority: "shadow_autonomous" as const,
      completion: completedWithEvidence({
        summary: "Decision from eligible set of supplied candidates",
        artifacts: {
          ...own,
          eligibleSet: decision.eligibleSet,
          selectedId: decision.recommendation.selectedId,
        },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const taskTitle = "Synthetic candidate evaluation";
    rejectIfProhibited(owner, taskTitle, "task_create");

    const task = repo.upsert({
      kind: "task_delegation",
      id: stableId("tsk", `${runKey}:task:eval`),
      idempotencyKey: `${runKey}:task:eval`,
      objectiveId: objective.id,
      decisionId: decisionRec.id,
      priorityId: priority.id,
      source: "synthetic" as const,
      mode,
      title: taskTitle,
      assignee: "shadow-ceo-agent",
      instructions:
        "Evaluate only Grand-King-supplied candidates against supplied rules. Do not load demo catalog.",
      actionIdempotencyKey: `${runKey}:action:eval`,
      completion: completedWithEvidence({
        summary: "Candidate evaluation task delegated",
        artifacts: { ...own, permittedOnly: true },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    rejectIfProhibited(owner, taskTitle, "execute");

    const action = repo.upsert({
      kind: "action",
      id: stableId("act", `${runKey}:action:eval`),
      idempotencyKey: `${runKey}:action:eval`,
      objectiveId: objective.id,
      decisionId: decisionRec.id,
      taskId: task.id,
      approvalId: null,
      source: "synthetic" as const,
      mode,
      title: "Synthetic candidate evaluation (authorized)",
      actionKind: "AUTHORIZED_SYNTHETIC" as const,
      executionStatus: "EXECUTED" as const,
      economicClaim: "none" as const,
      resultSummary: formatEligibleSelectedAnswer(decision),
      completion: completedWithEvidence({
        summary: "Candidate evaluation executed with zero financial effect",
        artifacts: {
          ...own,
          spendingUsd: 0,
          revenueUsd: 0,
          profitUsd: 0,
          ledgerMoved: false,
          demoCatalogUsed: false,
        },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const outcome = repo.upsert({
      kind: "outcome",
      id: stableId("out", `${runKey}:outcome`),
      idempotencyKey: `${runKey}:outcome`,
      objectiveId: objective.id,
      decisionId: decisionRec.id,
      actionIds: [action.id],
      source: "synthetic" as const,
      mode,
      expectedResult: "Eligible set and selection from supplied facts only",
      actualResult: formatEligibleSelectedAnswer(decision),
      variance: "none",
      completion: completedWithEvidence({
        summary: "Outcome matches supplied-fact evaluation",
        artifacts: { ...own, actionId: action.id },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const lesson = repo.upsert({
      kind: "lesson",
      id: stableId("les", `${runKey}:lesson`),
      idempotencyKey: `${runKey}:lesson`,
      objectiveId: objective.id,
      outcomeId: outcome.id,
      source: "synthetic" as const,
      mode,
      statement:
        "Supplied products and rules own the episode; demo catalogs must not substitute Grand King facts.",
      confidence: "high" as const,
      conditions: "Applies to synthetic candidate evaluation under SYNTHETIC mode",
      completion: completedWithEvidence({
        summary: "Lesson from request-bound evaluation",
        artifacts: { ...own, outcomeId: outcome.id },
        capturedAt: ts,
      }),
      createdAt: ts,
      updatedAt: ts,
    });

    const chain = loadChain(repo, objective.id);
    if (!chain) throw new Error("Failed to reload candidate-evaluation chain");
    const issues = verifyChainIntegrity(chain);
    if (issues.length > 0) {
      throw new Error(issues.map((i) => `${i.code}:${i.message}`).join("; "));
    }

    // Mix detection: every record must carry matching ownership in evidence artifacts.
    for (const rec of [
      objective,
      assessment,
      priority,
      decisionRec,
      task,
      action,
      outcome,
      lesson,
    ]) {
      const art =
        rec.completion.status === "COMPLETED" ? rec.completion.evidence?.artifacts : null;
      if (art) {
        assertSameRequestOwnership(
          owner,
          {
            requestId: String(art.requestId ?? ""),
            runId: String(art.runId ?? ""),
            correlationId: String(art.correlationId ?? ""),
          },
          rec.kind,
        );
      }
    }

    if (chain.tasks.length !== 1) {
      throw new Error(
        `REQUEST_CONTROL_FAILED: expected exactly 1 task, found ${chain.tasks.length}`,
      );
    }
    if (chain.actions.length !== 1) {
      throw new Error(
        `REQUEST_CONTROL_FAILED: expected exactly 1 action, found ${chain.actions.length}`,
      );
    }
    if (chain.approvals.length > 0) {
      throw new Error("REQUEST_CONTROL_FAILED: approval records not permitted for diagnostic eval");
    }

    const contract = parseEligibleSelectedContract(owner.completeInstruction);
    let message = formatEligibleSelectedAnswer(decision);
    if (contract.detected) {
      const lines = message.split("\n");
      if (lines.length !== contract.expectedLines) {
        throw new Error(
          `PILLOW_RESPONSE_CONTRACT_BLOCKED: expected ${contract.expectedLines} lines, got ${lines.length}`,
        );
      }
    }

    // Token preservation when requested alongside eligible/selected.
    const token =
      /Checkpoint\s+token\s*[:=]\s*([A-Z0-9][A-Z0-9_-]{2,64})/i.exec(
        owner.completeInstruction,
      )?.[1] ?? null;
    if (token && !message.includes(token) && /\bpreserve\s+.*token\b/i.test(owner.completeInstruction)) {
      // Only append if answer format allows more lines — otherwise contract already set.
      if (!contract.detected) {
        message = `${message}\nCheckpoint token: ${token.toUpperCase()}`;
      }
    }

    return {
      objectiveId: objective.id,
      requestId: owner.requestId,
      runId: owner.runId,
      correlationId: owner.correlationId,
      message,
      decision,
      financialEffect: {
        spendingUsd: 0,
        revenueUsd: 0,
        profitUsd: 0,
        ledgerMoved: false,
      },
      tasksCreated: [task.id],
      actionsCreated: [action.id],
    };
  } finally {
    try {
      repo.close();
    } catch {
      /* ignore */
    }
  }
}

export type { ShadowCeoActionKind };

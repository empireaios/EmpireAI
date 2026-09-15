/**
 * Shadow CEO chat admission — Grand King request owns the episode.
 * Demo vertical slice is NEVER auto-run from chat (explicit /shadow-ceo route only).
 */

import { createHash } from "node:crypto";

import {
  isSuppliedCandidateEvaluationAsk,
  parsePermittedActionsFromMessage,
} from "./action-permit.js";
import {
  bindSuppliedProducts,
  formatEligibleSelectedAnswer,
  parseEligibleSelectedContract,
  runCandidateEvaluationEpisode,
} from "./candidate-evaluation-episode.js";
import {
  instructionDigest,
  newRequestId,
  newRunId,
  persistRequestOwner,
  type RequestOwnerRecord,
} from "./request-owner.js";

export type ShadowCeoChatAdmission =
  | {
      admitted: true;
      blocked: false;
      objectiveId: string;
      correlationId: string;
      runKey: string;
      requestId: string;
      message: string;
      kind: "shadow_ceo_episode" | "candidate_evaluation";
      ledgerRealisedSyntheticNetProfitUsd: number;
      syntheticCatalogProductCount: number;
      eligibleProductCount: number;
      financialEffect: {
        spendingUsd: 0;
        revenueUsd: 0;
        profitUsd: 0;
        ledgerMoved: false;
      };
      suppliedProductNames: string[];
    }
  | {
      admitted: true;
      blocked: true;
      code: "SHADOW_CEO_EXECUTION_BLOCKED";
      stage: string;
      reason: string;
      correlationId: string;
      objectiveId: string | null;
      requestId: string | null;
      message: string;
      kind: "shadow_ceo_blocked";
    }
  | { admitted: false };

/** Generic Shadow CEO operating intent — not keyed to SC-01 targets or names. */
export function detectShadowCeoOperatingIntent(message: string): boolean {
  const t = String(message || "");
  if (!t.trim()) return false;

  // Supplied candidate evaluation is always admitted into the request-owner path.
  if (isSuppliedCandidateEvaluationAsk(t)) return true;

  const mentionsShadowCeo = /\bshadow[\s_-]*ceo\b/i.test(t);
  const mentionsSynthetic = /\bsynthetic\b/i.test(t);
  const mentionsSyntheticMode =
    /\bSYNTHETIC\s+mode\b/i.test(t) || /\bunder\s+SYNTHETIC\b/i.test(t);
  const operateIntent =
    /\b(operate|operating|execute|run|admit|continue|stand\s+up|open\s+one\s+bounded)\b/i.test(
      t,
    ) || /\b(objective|environment|control\s*plane|operating\s+loop|episode)\b/i.test(t);
  const commerceOps =
    /\b(amazon|commerce|profit|experiment|trial|listing|product\s+cohort|contribution)\b/i.test(
      t,
    );
  const noLive =
    /\b(do not touch live|no real|not live|real commerce|SYNTHETIC\s+mode|under\s+SYNTHETIC)\b/i.test(
      t,
    );

  if (mentionsShadowCeo && (operateIntent || mentionsSyntheticMode || mentionsSynthetic)) {
    return true;
  }
  if (mentionsSynthetic && commerceOps && operateIntent && noLive) {
    return true;
  }
  return false;
}

function stableRunKey(workspaceId: string, message: string): string {
  const digest = createHash("sha256")
    .update(`${workspaceId}\n${normalizeObjectiveText(message)}`)
    .digest("hex")
    .slice(0, 24);
  return `chat_${digest}`;
}

function normalizeObjectiveText(message: string): string {
  return String(message || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4000);
}

function formatBlocked(input: {
  stage: string;
  reason: string;
  correlationId: string;
  objectiveId: string | null;
  requestId?: string | null;
}): string {
  const lines = [
    "### SHADOW_CEO_EXECUTION_BLOCKED",
    "",
    `- Code: \`SHADOW_CEO_EXECUTION_BLOCKED\``,
    `- Stage: \`${input.stage}\``,
    `- Reason: ${input.reason}`,
    `- Correlation ID: \`${input.correlationId}\``,
    `- Objective ID: \`${input.objectiveId ?? "none"}\``,
  ];
  if (input.requestId) {
    lines.push(`- Request ID: \`${input.requestId}\``);
  }
  lines.push(
    `- Mode: SYNTHETIC · Birth: NOT_BORN · Real commerce: locked`,
    "",
    "No ordinary planning prose is substituted for execution.",
    "Demo catalogs and vertical-slice routines are isolated from Grand King chat.",
  );
  return lines.join("\n");
}

function buildOwner(input: {
  message: string;
  workspaceId: string;
  correlationId: string;
  products: RequestOwnerRecord["suppliedProducts"];
  rules: Record<string, unknown>;
}): RequestOwnerRecord {
  const digest = instructionDigest(input.workspaceId, input.message);
  const actions = parsePermittedActionsFromMessage(input.message);
  const contract = parseEligibleSelectedContract(input.message);
  return {
    requestId: newRequestId(),
    runId: newRunId(digest),
    correlationId: input.correlationId,
    completeInstruction: String(input.message || "").trim().slice(0, 16000),
    suppliedProducts: input.products,
    eligibilityRules: input.rules,
    requestedBusinessOperation: "synthetic_candidate_evaluation",
    permittedActions: actions.permitted,
    prohibitedActions: actions.prohibited,
    requestedAnswerFormat: {
      expectedLineCount: contract.detected ? contract.expectedLines : null,
      fieldNames: contract.detected
        ? ["Eligible candidates", "Candidate selected"]
        : [],
      requiredToken: null,
      prohibitsExtraProse: contract.detected,
      template: contract.detected ? "eligible_selected" : "unspecified",
    },
    operatingMode: "SYNTHETIC",
    birthStatus: "NOT_BORN",
    realCommerceAuthority: "unauthorized",
    createdAt: new Date().toISOString(),
    workspaceId: input.workspaceId,
    instructionDigest: digest,
  };
}

/**
 * Admit a Shadow CEO / candidate-evaluation request from Pillow chat.
 * Never substitutes demo catalog or vertical-slice fulfilment/spend work.
 */
export function admitAndExecuteShadowCeoFromChat(input: {
  message: string;
  workspaceId: string;
  correlationId: string;
}): ShadowCeoChatAdmission {
  if (!detectShadowCeoOperatingIntent(input.message)) {
    return { admitted: false };
  }

  const runKey = stableRunKey(input.workspaceId, input.message);

  // Candidate evaluation with supplied facts — request owner path.
  if (
    isSuppliedCandidateEvaluationAsk(input.message) ||
    bindSuppliedProducts(input.message).products.length > 0
  ) {
    const bound = bindSuppliedProducts(input.message);
    if (!bound.decision || bound.products.length < 1) {
      const reason = bound.reason ?? "REQUEST_FACT_BINDING_FAILED";
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage: "REQUEST_FACT_BINDING_FAILED",
        reason,
        correlationId: input.correlationId,
        objectiveId: null,
        requestId: null,
        message: [
          "SHADOW_CEO_EXECUTION_BLOCKED: REQUEST_FACT_BINDING_FAILED — " + reason,
          "",
          "No demo catalog was substituted.",
          "No tasks or financial records were created.",
        ].join("\n"),
        kind: "shadow_ceo_blocked",
      };
    }

    try {
      const owner = persistRequestOwner(
        buildOwner({
          message: input.message,
          workspaceId: input.workspaceId,
          correlationId: input.correlationId,
          products: bound.products,
          rules: bound.rules,
        }),
      );

      const episode = runCandidateEvaluationEpisode({
        owner,
        decision: bound.decision,
      });

      // Contract: exact eligible/selected lines when requested.
      const contract = parseEligibleSelectedContract(input.message);
      let message = episode.message;
      if (contract.detected) {
        message = formatEligibleSelectedAnswer(bound.decision);
        const lines = message.split("\n").filter((l) => l.length > 0);
        if (lines.length !== contract.expectedLines) {
          return {
            admitted: true,
            blocked: true,
            code: "SHADOW_CEO_EXECUTION_BLOCKED",
            stage: "response_contract",
            reason: `PILLOW_RESPONSE_CONTRACT_BLOCKED: expected ${contract.expectedLines} lines`,
            correlationId: input.correlationId,
            objectiveId: episode.objectiveId,
            requestId: owner.requestId,
            message: `PILLOW_RESPONSE_CONTRACT_BLOCKED: expected ${contract.expectedLines} lines, got ${lines.length}`,
            kind: "shadow_ceo_blocked",
          };
        }
      }

      // Refuse generic brief substitution markers.
      if (/Shadow CEO Executive Brief \(source-backed\)/i.test(message)) {
        return {
          admitted: true,
          blocked: true,
          code: "SHADOW_CEO_EXECUTION_BLOCKED",
          stage: "response_contract",
          reason: "PILLOW_RESPONSE_CONTRACT_BLOCKED: generic brief forbidden",
          correlationId: input.correlationId,
          objectiveId: episode.objectiveId,
          requestId: owner.requestId,
          message:
            "PILLOW_RESPONSE_CONTRACT_BLOCKED: generic executive brief cannot replace requested format",
          kind: "shadow_ceo_blocked",
        };
      }

      return {
        admitted: true,
        blocked: false,
        objectiveId: episode.objectiveId,
        correlationId: input.correlationId,
        runKey: owner.runId,
        requestId: owner.requestId,
        message,
        kind: "candidate_evaluation",
        ledgerRealisedSyntheticNetProfitUsd: 0,
        syntheticCatalogProductCount: 0,
        eligibleProductCount: bound.decision.eligibleSet.length,
        financialEffect: episode.financialEffect,
        suppliedProductNames: bound.products.map((p) => p.name),
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      const stage = /REQUEST_FACT_BINDING/i.test(reason)
        ? "REQUEST_FACT_BINDING_FAILED"
        : /PILLOW_RESPONSE_CONTRACT/i.test(reason)
          ? "response_contract"
          : /REQUEST_MIX/i.test(reason)
            ? "request_mix"
            : "admission_or_execution";
      return {
        admitted: true,
        blocked: true,
        code: "SHADOW_CEO_EXECUTION_BLOCKED",
        stage,
        reason,
        correlationId: input.correlationId,
        objectiveId: null,
        requestId: null,
        message: formatBlocked({
          stage,
          reason,
          correlationId: input.correlationId,
          objectiveId: null,
        }),
        kind: "shadow_ceo_blocked",
      };
    }
  }

  // Operating intent without supplied candidate facts: do NOT fall back to demo catalog.
  return {
    admitted: true,
    blocked: true,
    code: "SHADOW_CEO_EXECUTION_BLOCKED",
    stage: "REQUEST_FACT_BINDING_FAILED",
    reason:
      "REQUEST_FACT_BINDING_FAILED — no Grand-King-supplied candidates/rules; demonstration vertical-slice is isolated to POST /shadow-ceo/run-vertical-slice",
    correlationId: input.correlationId,
    objectiveId: null,
    requestId: null,
    message: [
      "SHADOW_CEO_EXECUTION_BLOCKED: REQUEST_FACT_BINDING_FAILED — no Grand-King-supplied candidates/rules",
      "",
      "Demonstration catalogs and fulfilment/supplier-spend vertical slices are isolated.",
      "They are not available from ordinary Pillow chat and were not substituted.",
      `Correlation ID: ${input.correlationId}`,
      `Run key (deterministic): ${runKey}`,
      "Mode: SYNTHETIC · Birth: NOT_BORN · Real commerce: locked",
    ].join("\n"),
    kind: "shadow_ceo_blocked",
  };
}

/** Unsupported plan-as-execution claims for Shadow CEO visible surfaces. */
export function shadowCeoPlanAsExecutionViolations(text: string): string[] {
  const t = String(text || "");
  const hits: string[] = [];
  if (/\bI (initiated|executed|delegated|learned)\b/i.test(t) && !/\bobj_[a-z0-9_]+\b/i.test(t)) {
    hits.push("first_person_execution_without_objective_id");
  }
  if (/\bthe plan will be executed\b/i.test(t) && !/\bstatus=EXECUTED\b|\bEXECUTED\b/.test(t)) {
    hits.push("plan_will_be_executed_without_executed_action");
  }
  if (
    /\bDO\s+NOT\s+SELECT\s+ANY\b/i.test(t) &&
    /Shadow CEO Executive Brief \(source-backed\)/i.test(t)
  ) {
    hits.push("dns_appender_on_shadow_ceo_brief");
  }
  return hits;
}

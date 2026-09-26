/**
 * Exact-model paid LLM admission. No rate sheet is inferred from a model name:
 * an administrator must supply a short-lived pricing record and Cost Guard
 * must already contain owner-authorized budgets. Reservations remain committed
 * until reconciled to provider billing, including uncertain timeout charges.
 */
import { getDatabase } from "../database.js";
import {
  assertPaidAutonomousAllowed, buildCostGuardStatus, recordCostSpend,
} from "../../orchestration/pillow-commissioning/cost-guard.js";
import type { LLMCompletionRequest, LLMProviderName } from "../types.js";

type Price = {
  provider: LLMProviderName;
  model: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
  approvedBy: string;
  approvedAt: string;
  expiresAt: string;
};

function authorizedPrice(provider: LLMProviderName, model: string): Price {
  let rows: unknown;
  try { rows = JSON.parse(process.env.LLM_AUTHORIZED_PRICING_JSON ?? "null"); }
  catch { throw new Error("LLM pricing authorization malformed"); }
  if (!Array.isArray(rows)) throw new Error("LLM pricing authorization unavailable");
  const matches = rows.filter((row): row is Price =>
    Boolean(row && typeof row === "object" &&
      (row as Price).provider === provider && (row as Price).model === model));
  if (matches.length !== 1) throw new Error("Exact LLM provider/model price authorization required");
  const price = matches[0]!;
  const approved = Date.parse(price.approvedAt);
  const expires = Date.parse(price.expiresAt);
  if (price.approvedBy !== "founder" || !Number.isFinite(approved) ||
      !Number.isFinite(expires) || approved > Date.now() ||
      expires <= Date.now() || expires > approved + 7 * 24 * 60 * 60_000 ||
      ![price.inputUsdPerMillion, price.outputUsdPerMillion].every(
        value => typeof value === "number" && Number.isFinite(value) && value > 0 && value <= 1000,
      )) throw new Error("LLM pricing authorization expired or invalid");
  return price;
}

export function quoteBoundedLLMCall(request: LLMCompletionRequest, provider: LLMProviderName): {
  model: string; maxOutputTokens: number; reservedUsd: number;
} {
  if (!request.model || !request.model.trim()) {
    throw new Error("Exact LLM model required before paid dispatch");
  }
  const maxOutputTokens = request.maxTokens ?? 4096;
  if (!Number.isSafeInteger(maxOutputTokens) || maxOutputTokens < 1 || maxOutputTokens > 8192 ||
      request.messages.length < 1 || request.messages.length > 64 ||
      (request.tools?.length ?? 0) > 32) {
    throw new Error("LLM token or message limits invalid");
  }
  const bytes = Buffer.byteLength(JSON.stringify({ messages: request.messages, tools: request.tools ?? [] }));
  if (bytes > 64 * 1024) throw new Error("LLM prompt exceeds bounded byte limit");
  const price = authorizedPrice(provider, request.model);
  // A UTF-8 byte is an upper bound on textual token count, with extra headroom
  // for framing and tool schema overhead. Provider-specific billing reconciliation
  // remains required before any reservation can be released.
  const inputUpperTokens = bytes + 2048 + request.messages.length * 512 +
    (request.tools?.length ?? 0) * 512;
  const quote = (inputUpperTokens * price.inputUsdPerMillion +
    maxOutputTokens * price.outputUsdPerMillion) / 1_000_000;
  const reservedUsd = Math.ceil(quote * 1_000_000) / 1_000_000;
  if (!Number.isFinite(reservedUsd) || reservedUsd <= 0) {
    throw new Error("LLM spend quote invalid");
  }
  return { model: request.model, maxOutputTokens, reservedUsd };
}

export async function reserveBoundedLLMCall(input: {
  request: LLMCompletionRequest;
  provider: LLMProviderName;
  quote: ReturnType<typeof quoteBoundedLLMCall>;
}): Promise<void> {
  const { request, provider, quote } = input;
  const gate = assertPaidAutonomousAllowed(request.workspaceId, quote.reservedUsd);
  if (!gate.allowed) throw new Error(`Cost Guard HARD STOP: ${gate.reason}`);
  const status = buildCostGuardStatus(request.workspaceId);
  const modelLimit = status.limits.providerModelBudgetUsd;
  if (typeof modelLimit !== "number" || !Number.isFinite(modelLimit) || modelLimit < 0) {
    throw new Error("LLM provider/model budget unknown or invalid");
  }
  const month = new Date();
  const since = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1)).toISOString();
  const rows = getDatabase().prepare(`
    SELECT amount_usd, attribution_json FROM pillow_cost_spend_events
    WHERE workspace_id = @workspaceId AND provider = @provider
      AND recorded_at >= @since AND kind IN ('ai', 'ai:committed')
  `).all({ workspaceId: request.workspaceId, provider, since }) as Array<{
    amount_usd: number; attribution_json: string;
  }>;
  let used = 0;
  for (const row of rows) {
    let attribution: Record<string, unknown>;
    try { attribution = JSON.parse(row.attribution_json) as Record<string, unknown>; }
    catch { throw new Error("LLM provider/model ledger malformed"); }
    if (attribution.model === quote.model) {
      if (!Number.isFinite(row.amount_usd) || row.amount_usd < 0) {
        throw new Error("LLM provider/model ledger invalid");
      }
      used += row.amount_usd;
    }
  }
  if (!Number.isFinite(used) || used + quote.reservedUsd > modelLimit) {
    throw new Error("LLM provider/model budget exceeded");
  }
  // Synchronous ledger write after the last gate; another call on this worker
  // observes this commitment before its own admission check.
  recordCostSpend({
    workspaceId: request.workspaceId, kind: "ai", committed: true,
    amountUsd: quote.reservedUsd, provider,
    attribution: {
      model: quote.model, correlationId: request.correlationId,
      quote: "bounded-maximum; settlement-pending",
    },
  });
  await getDatabase().requestCriticalPersist(); // No network request before disk receipt.
}

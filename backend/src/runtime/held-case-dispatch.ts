/** Inactive server-side primitive. No route, provider constructor, credentials, or default approval.
 * Injected verifier and adapter are trusted application code, never request metadata.
 * Billing remains fully reserved after success; only separate final-invoice reconciliation releases it.
 */
import { createHash } from 'node:crypto';
import { HeldCaseBudgetLedger, type HeldBudgetIdentity } from './held-case-budget-ledger.js';
import { withLLMDeadline } from '../brain/llm/call-control.js';

type Message = { role: 'system' | 'user' | 'assistant'; content: string };
export type HeldDispatchRequest = {
  campaignId: string; caseId: string; step: number; workspaceId: string; serviceId: string;
  sourceCommit: string; caseSetSha256: string; provider: string; model: string;
  messages: Message[]; maxOutputTokens: number;
};
export type HeldDispatchPolicy = {
  campaignId: string; approvalReference: string; workspaceId: string; serviceId: string;
  sourceCommit: string; caseSetSha256: string; provider: string; model: string;
  capMicroUsd: number; expiresAt: string; timeoutMs: number;
  maxInputBytes: number; maxOutputBytes: number; maxOutputTokens: number;
  pricing: { provenanceSha256: string; validUntil: string; inputMicroUsdPerMillion: number; outputMicroUsdPerMillion: number; otherChargeUpperMicroUsd: number };
  steps: Array<{ caseId: string; step: number; messagesSha256: string; inputTokenUpperBound: number }>;
};
type Scope = Pick<HeldDispatchRequest, 'workspaceId' | 'serviceId' | 'sourceCommit' | 'caseSetSha256'>;
export type HeldDispatchDependencies = {
  ledger: HeldCaseBudgetLedger;
  /** Must independently check owner approval, ordinary paid/engineering gates, pricing,
   * frozen prompt commitments and actual server scope. An approval string alone is insufficient. */
  verifyApprovedPolicy?: (request: Readonly<HeldDispatchRequest>, signal: AbortSignal) => Promise<HeldDispatchPolicy | null>;
  actualScope?: () => Scope;
  adapter?: {
    provider: string; model: string; automaticRetries: 0; supportsAbort: true;
    dispatch: (request: { messages: Message[]; maxTokens: number; provider: string; model: string; signal: AbortSignal }) => Promise<{ provider: string; model: string; content: string; toolCalls?: unknown }>;
  };
};
const SHA = /^[a-f0-9]{64}$/;
const ID = /^[A-Za-z0-9][A-Za-z0-9_.:/-]{0,99}$/;
const requireThat = (ok: unknown, code: string): void => { if (!ok) throw new Error(code); };
const hash = (value: string): string => createHash('sha256').update(value).digest('hex');
function freezeSnapshot<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeSnapshot(child);
    Object.freeze(value);
  }
  return value;
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k,v]) => JSON.stringify(k) + ':' + canonical(v)).join(',') + '}';
  return JSON.stringify(value) ?? 'null';
}
export function heldMessagesSha256(messages: Message[]): string { return hash(canonical(messages)); }
function positive(value: unknown, maximum = Number.MAX_SAFE_INTEGER): void {
  requireThat(typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= maximum, 'INVALID_BOUNDED_INTEGER');
}
function exact(value: object, keys: string[]): void {
  requireThat(value !== null && typeof value === 'object' && Object.keys(value).sort().join() === keys.sort().join(), 'UNEXPECTED_POLICY_OR_REQUEST_FIELDS');
}
function validatePolicy(p: HeldDispatchPolicy, r: HeldDispatchRequest, scope: Scope): void {
  exact(p, ['campaignId','approvalReference','workspaceId','serviceId','sourceCommit','caseSetSha256','provider','model','capMicroUsd','expiresAt','timeoutMs','maxInputBytes','maxOutputBytes','maxOutputTokens','pricing','steps']);
  for (const key of ['campaignId','workspaceId','serviceId','provider','model'] as const) requireThat(ID.test(p[key]) && p[key] === r[key], 'CAMPAIGN_BINDING_MISMATCH');
  requireThat(ID.test(p.approvalReference), 'APPROVAL_REFERENCE_REQUIRED');
  requireThat(/^[a-f0-9]{40}$/.test(p.sourceCommit) && p.sourceCommit === r.sourceCommit && SHA.test(p.caseSetSha256) && p.caseSetSha256 === r.caseSetSha256, 'SOURCE_OR_CASE_MISMATCH');
  for (const key of ['workspaceId','serviceId','sourceCommit','caseSetSha256'] as const) requireThat(scope[key] === p[key], 'ACTUAL_SCOPE_MISMATCH');
  requireThat(p.serviceId !== 'c3c89cbb-3e10-414a-98a2-f9ec4f1f840e', 'PRODUCTION_SERVICE_PROHIBITED');
  positive(p.capMicroUsd); positive(p.timeoutMs, 120000); positive(p.maxInputBytes, 262144); positive(p.maxOutputBytes, 1048576); positive(p.maxOutputTokens, 32768);
  requireThat(Number.isFinite(Date.parse(p.expiresAt)) && Date.parse(p.expiresAt) > Date.now(), 'CAMPAIGN_EXPIRED');
  exact(p.pricing, ['provenanceSha256','validUntil','inputMicroUsdPerMillion','outputMicroUsdPerMillion','otherChargeUpperMicroUsd']);
  requireThat(SHA.test(p.pricing.provenanceSha256) && Date.parse(p.pricing.validUntil) >= Date.parse(p.expiresAt), 'PRICING_UNKNOWN_OR_EXPIRED');
  // Zero/unknown rates are not silently interpreted as free usage.
  positive(p.pricing.inputMicroUsdPerMillion); positive(p.pricing.outputMicroUsdPerMillion);
  requireThat(Number.isSafeInteger(p.pricing.otherChargeUpperMicroUsd) && p.pricing.otherChargeUpperMicroUsd >= 0, 'OTHER_CHARGES_UNKNOWN');
  requireThat(Array.isArray(p.steps) && p.steps.length > 0 && p.steps.length <= 8, 'CASE_STEP_BOUND');
  const ids = new Set<string>();
  for (const s of p.steps) {
    exact(s, ['caseId','step','messagesSha256','inputTokenUpperBound']);
    requireThat(ID.test(s.caseId) && Number.isInteger(s.step) && s.step >= 0 && s.step <= 1 && SHA.test(s.messagesSha256), 'INVALID_CASE_STEP');
    positive(s.inputTokenUpperBound, 1048576);
    const id = `${s.caseId}/${s.step}`; requireThat(!ids.has(id), 'DUPLICATE_POLICY_STEP'); ids.add(id);
  }
  requireThat(new Set(p.steps.map(s => s.caseId)).size <= 6, 'CASE_COUNT_BOUND');
}

export async function dispatchHeldCase(input: HeldDispatchRequest, dependencies: HeldDispatchDependencies, signal?: AbortSignal) {
  requireThat(dependencies.verifyApprovedPolicy && dependencies.actualScope && dependencies.adapter, 'HELD_DISPATCH_UNCONFIGURED');
  exact(input, ['campaignId','caseId','step','workspaceId','serviceId','sourceCommit','caseSetSha256','provider','model','messages','maxOutputTokens']);
  requireThat(ID.test(input.caseId) && Number.isInteger(input.step) && input.step >= 0 && input.step <= 1, 'INVALID_CASE_STEP');
  requireThat(Array.isArray(input.messages) && input.messages.length > 0 && input.messages.length <= 64, 'MESSAGE_BOUND');
  for (const m of input.messages) {
    exact(m, ['role','content']); requireThat(['system','user','assistant'].includes(m.role) && typeof m.content === 'string' && Buffer.byteLength(m.content) <= 262144, 'INVALID_MESSAGE');
  }
  positive(input.maxOutputTokens, 32768);
  // Snapshot before asynchronous verification: mutable caller objects cannot change the dispatched prompt.
  const request: HeldDispatchRequest = freezeSnapshot(JSON.parse(JSON.stringify(input)));
  const verified = await withLLMDeadline(s => dependencies.verifyApprovedPolicy!(request, s), 5000, signal);
  requireThat(verified, 'TRUSTED_APPROVAL_OR_PRICING_UNAVAILABLE');
  const policy: HeldDispatchPolicy = freezeSnapshot(JSON.parse(JSON.stringify(verified)));
  validatePolicy(policy, request, dependencies.actualScope!());
  const adapter = dependencies.adapter!;
  requireThat(adapter.provider === policy.provider && adapter.model === policy.model && adapter.automaticRetries === 0 && adapter.supportsAbort === true, 'EXPLICIT_SINGLE_ATTEMPT_ADAPTER_REQUIRED');
  const step = policy.steps.find(s => s.caseId === request.caseId && s.step === request.step);
  requireThat(step && step.messagesSha256 === heldMessagesSha256(request.messages), 'UNAPPROVED_PROMPT');
  requireThat(Buffer.byteLength(canonical(request.messages)) <= policy.maxInputBytes && request.maxOutputTokens <= policy.maxOutputTokens, 'INPUT_OR_OUTPUT_BOUND');
  const ceilMillion = (value: bigint) => (value + 999999n) / 1000000n;
  const upper = ceilMillion(BigInt(step!.inputTokenUpperBound) * BigInt(policy.pricing.inputMicroUsdPerMillion)) + ceilMillion(BigInt(request.maxOutputTokens) * BigInt(policy.pricing.outputMicroUsdPerMillion)) + BigInt(policy.pricing.otherChargeUpperMicroUsd);
  requireThat(upper > 0 && upper <= BigInt(Number.MAX_SAFE_INTEGER), 'UNKNOWN_OR_UNBOUNDED_COST');
  const policySha256 = hash(canonical(policy));
  const identity: HeldBudgetIdentity = { campaignId: policy.campaignId, approvalReference: `${policy.approvalReference}/policy/${policySha256}`,
    workspaceId: policy.workspaceId, serviceId: policy.serviceId, sourceCommit: policy.sourceCommit, caseSetSha256: policy.caseSetSha256, provider: policy.provider, model: policy.model };
  const attemptId = `held/${hash(canonical([policy.campaignId, request.caseId, request.step]))}`;
  signal?.throwIfAborted();
  dependencies.ledger.createCampaign({ identity, capMicroUsd: policy.capMicroUsd, expiresAt: policy.expiresAt });
  const reservation = dependencies.ledger.reserve(identity, attemptId, Number(upper));
  requireThat(reservation.authorizedToStart, 'EXISTING_ATTEMPT_MUST_NOT_REDISPATCH');
  let timeoutAbort = false;
  try {
    const remaining = Math.min(policy.timeoutMs, Date.parse(policy.expiresAt) - Date.now());
    requireThat(remaining > 0, 'CAMPAIGN_EXPIRED');
    const response = await withLLMDeadline(async abortSignal => {
      abortSignal.addEventListener('abort', () => { timeoutAbort = true; }, { once: true });
      return adapter.dispatch({ provider: policy.provider, model: policy.model, messages: request.messages, maxTokens: request.maxOutputTokens, signal: abortSignal });
    }, remaining, signal);
    const noToolCalls = response.toolCalls === undefined || (Array.isArray(response.toolCalls) && response.toolCalls.length === 0);
    requireThat(response.provider === policy.provider && response.model === policy.model && noToolCalls && typeof response.content === 'string' && Buffer.byteLength(response.content) <= policy.maxOutputBytes, 'PROVIDER_RESPONSE_OUTSIDE_POLICY');
    // Deliberately no settleFinal call: tokens/content are not a final invoice.
    return { status: 'COMPLETED_UNRECONCILED' as const, content: response.content, attemptId, policySha256, identity,
      reservedMicroUsd: Number(upper), noCredit: true as const, providerEnforcementProven: false as const, invoiceReconciled: false as const };
  } catch {
    dependencies.ledger.markUncertain(identity, attemptId, signal?.aborted ? 'INTERRUPTED' : timeoutAbort ? 'TIMEOUT' : 'PROVIDER_ERROR');
    throw new Error('HELD_DISPATCH_UNCERTAIN_RESERVATION_RETAINED');
  }
}

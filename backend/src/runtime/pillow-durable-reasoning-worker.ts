/** Durable reasoning-only transport. No purchase/publish/spend tools are routed here. */
import {
  claimNextReasoningRequest,
  classifyUpstreamFailure,
  policyForFailure,
  settleReasoningRequest,
  releaseInterruptedReasoningRequest,
  type ClaimedReasoningRequest,
  type ChatFailureClass,
} from "./pillow-chat-request-store.js";

export type ReasoningAttempt =
  | { ok: true; result: Record<string, unknown> }
  | { ok: false; failureClass: ChatFailureClass; error: string; upstreamStatus?: number };

const COMPLETED_REASONING_KINDS = new Set(["llm", "authority_refusal", "authority_facts", "response_contract"]);

export async function executeReasoningProxy(
  job: ClaimedReasoningRequest,
  workerPort: number,
  timeoutMs = 200_000,
  shutdownSignal?: AbortSignal,
): Promise<ReasoningAttempt> {
  if (job.input.kind !== "reasoning") throw new Error("side_effect_retry_forbidden");
  try {
    const response = await fetch(`http://127.0.0.1:${workerPort}/api/pillow/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${job.input.sessionToken}`,
        "x-empire-pillow-request-id": job.request.requestId,
        "x-empire-pillow-request-kind": "reasoning",
        "x-empire-pillow-fence": String(job.request.leaseToken),
      },
      body: job.input.bodyText,
      signal: shutdownSignal
        ? AbortSignal.any([AbortSignal.timeout(timeoutMs), shutdownSignal])
        : AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) return {
      ok: false,
      failureClass: classifyUpstreamFailure({ status: response.status }),
      error: "upstream_error",
      upstreamStatus: response.status,
    };
    const body = await response.json() as Record<string, unknown>;
    const result = body.result && typeof body.result === "object"
      ? body.result as Record<string, unknown> : body;
    const message = typeof result.message === "string" ? result.message.trim() : "";
    // A receipt or infrastructure fallback is not a completed executive answer.
    const constitutionalGate = result.constitutionalGate as { allowed?: boolean } | undefined;
    const responseContract = result.responseContract as { code?: string } | undefined;
    if (!message || !COMPLETED_REASONING_KINDS.has(String(result.kind)) ||
      constitutionalGate?.allowed === false || /blocked/i.test(responseContract?.code ?? "") ||
      result.degradedUsed === true || result.transportContractPassed === false || result.semanticSuccess === false ||
      result.brainCompleted === false || result.requestRemainsRunning === true ||
      message.startsWith("PILLOW_RESULT_PENDING:")) {
      return { ok: false, failureClass: "BRAIN_RETRYABLE_FAILURE", error: "upstream_not_completed" };
    }
    return { ok: true, result: {
      ...result,
      ...(typeof body.reboundSessionId === "string" ? { reboundSessionId: body.reboundSessionId } : {}),
      ...(body.requestProvenance && typeof body.requestProvenance === "object" ? { requestProvenance: body.requestProvenance } : {}),
      requestId: job.request.requestId,
      durableRequestId: job.request.requestId,
      durableRequest: true,
      status: "COMPLETED",
    } };
  } catch (error) {
    const timeout = error instanceof Error && error.name === "TimeoutError";
    return { ok: false, failureClass: timeout ? "BRAIN_TIMEOUT_RETRYABLE" : "NETWORK",
      error: timeout ? "timeout" : "network" };
  }
}

export async function runOneDurableReasoningAttempt(options: {
  owner: string;
  execute: (job: ClaimedReasoningRequest) => Promise<ReasoningAttempt>;
  leaseMs?: number;
  maxAttempts?: number;
  /** Probe before claiming: startup/recycle is not a consumed reasoning attempt. */
  ready?: () => Promise<boolean>;
  signal?: AbortSignal;
}): Promise<boolean> {
  if (options.signal?.aborted) return false;
  if (options.ready && !(await options.ready())) return false;
  if (options.signal?.aborted) return false;
  const job = await claimNextReasoningRequest({
    owner: options.owner, leaseMs: options.leaseMs ?? 230_000, maxAttempts: options.maxAttempts ?? 3,
  });
  if (!job) return false;
  // If the process dies here, lease expiry makes this full input reclaimable.
  const result: ReasoningAttempt = options.signal?.aborted
    ? { ok: false, failureClass: "NETWORK", error: "worker_shutting_down" }
    : await options.execute(job);
  if (!result.ok && options.signal?.aborted) {
    await releaseInterruptedReasoningRequest({ requestId: job.request.requestId, leaseToken: job.request.leaseToken! });
    return true;
  }
  await settleReasoningRequest({
    requestId: job.request.requestId,
    leaseToken: job.request.leaseToken!,
    maxAttempts: options.maxAttempts ?? 3,
    ...(result.ok ? { result: result.result } : {
      failureClass: result.failureClass,
      error: result.error,
      upstreamStatus: result.upstreamStatus,
      fatal: policyForFailure(result.failureClass) === "FAIL",
      retryDelayMs: Math.min(30_000, 2 ** job.request.attemptCount * 1_000),
    }),
  });
  return true;
}

/** Timer discovers Redis-owned work; it is not the source of ownership. */
export function startDurableReasoningSweeper(options: {
  owner: string;
  workerPort: number;
  onError: (error: unknown) => void;
  ready: () => Promise<boolean>;
}): () => Promise<void> {
  let running = false;
  let stopped = false;
  let shutdownFailed = false;
  let shutdownError: unknown;
  const cancellation = new AbortController();
  let inFlight: Promise<void> = Promise.resolve();
  const tick = async () => {
    if (running || stopped) return;
    running = true;
    try {
      await runOneDurableReasoningAttempt({ owner: options.owner, ready: options.ready,
        signal: cancellation.signal,
        execute: (job) => executeReasoningProxy(job, options.workerPort, 200_000, cancellation.signal) });
    } catch (error) {
      if (stopped) { shutdownFailed = true; shutdownError = error; }
      options.onError(error);
    }
    finally { running = false; }
  };
  const runTick = () => { if (!running && !stopped) inFlight = tick(); };
  const timer = setInterval(runTick, 1_000);
  timer.unref();
  runTick();
  return async () => {
    stopped = true;
    clearInterval(timer);
    cancellation.abort();
    await inFlight;
    if (shutdownFailed) throw shutdownError;
  };
}

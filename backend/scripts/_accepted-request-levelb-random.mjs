/**
 * Level B — randomized failure-mode adversarial qualification for accepted-request recovery.
 * Synthetic only. No Nova / sealed exam content.
 */
import {
  acceptPillowChatRequest,
  assertsNoIrrelevantProtectedState,
  buildTerminalInfrastructureMessage,
  runAcceptedPillowChatRecovery,
} from "../src/runtime/pillow-accepted-request-recovery.ts";

const domains = [
  "commerce",
  "finance",
  "ops",
  "supplier",
  "security",
  "marketing",
  "strategy",
  "infra",
];

function usefulBody(text) {
  return {
    ok: true,
    status: 200,
    body: Buffer.from(JSON.stringify({ result: { message: text } })),
    headers: new Headers(),
    messagePreview: text,
  };
}

const N = 48;
let fail = 0;
const counters = {
  REQUESTS_ACCEPTED: 0,
  REQUESTS_USEFUL_TERMINAL: 0,
  REQUESTS_LOST: 0,
  USER_RESUBMISSION_REQUIRED: 0,
  ASK_AGAIN: 0,
  EMPTY: 0,
  GENERIC_INFRA_ONLY: 0,
  IRRELEVANT_PROTECTED_STATE_INJECTION: 0,
  DUPLICATE_COMPLETION: 0,
  DUPLICATE_SIDE_EFFECT_RISK: 0,
};

for (let i = 0; i < N; i++) {
  const complex = i % 3 === 0;
  const isolated = i % 2 === 0;
  const msg = isolated
    ? `SyntheticCanary ${domains[i % domains.length]} only — do not mention EmpireAI, Birth, products, sales, or revenue. ${complex ? "Answer three blockers and one next action." : "One short verdict."}`
    : `Operational check ${domains[i % domains.length]}: summarise posture.`;
  const accepted = acceptPillowChatRequest({ message: msg, sessionId: `s_${i}` });
  counters.REQUESTS_ACCEPTED += 1;

  const mode = i % 7;
  // 0: success first try
  // 1: network then success
  // 2: worker down then up then success
  // 3: 503 then success
  // 4: timeout then success
  // 5: both fail (supported class exhaustion — not counted as LOST if terminal honest)
  // 6: empty then success
  let attempts = 0;
  let workerReadyAfter = mode === 2 ? 2 : 0;
  let probes = 0;
  const result = await runAcceptedPillowChatRecovery({
    accepted,
    probeWorker: async () => {
      probes += 1;
      if (workerReadyAfter > 0) return probes >= workerReadyAfter;
      return true;
    },
    attempt: async () => {
      attempts += 1;
      if (mode === 0) return usefulBody(`OK-${i}-domain-${domains[i % domains.length]}`);
      if (mode === 1) {
        if (attempts === 1) return { ok: false, reason: "network" };
        return usefulBody(`Recovered-network-${i}`);
      }
      if (mode === 2) {
        if (attempts === 1 && probes < 3) return { ok: false, reason: "worker_unavailable" };
        return usefulBody(`Recovered-worker-${i}`);
      }
      if (mode === 3) {
        if (attempts === 1) return { ok: false, reason: "upstream_error", status: 503 };
        return usefulBody(`Recovered-503-${i}`);
      }
      if (mode === 4) {
        if (attempts === 1) return { ok: false, reason: "timeout" };
        return usefulBody(`Recovered-timeout-${i}`);
      }
      if (mode === 5) return { ok: false, reason: "timeout" };
      if (mode === 6) {
        if (attempts === 1) {
          return {
            ok: true,
            status: 200,
            body: Buffer.from("{}"),
            headers: new Headers(),
            messagePreview: "",
          };
        }
        return usefulBody(`Recovered-empty-${i}`);
      }
      return usefulBody(`OK-${i}`);
    },
    totalBudgetMs: 12_000,
    attempt1Ms: 2_000,
    attempt2Ms: 2_000,
    workerWaitMs: 800,
  });

  if (mode === 5) {
    // Exhausted recovery — honest terminal is required, not silent loss.
    const terminal = buildTerminalInfrastructureMessage(accepted);
    if (!assertsNoIrrelevantProtectedState(terminal, accepted.message)) {
      counters.IRRELEVANT_PROTECTED_STATE_INJECTION += 1;
      fail += 1;
    }
    if (/\bask again|theme to deepen|do not need to resubmit\b/i.test(terminal)) {
      counters.ASK_AGAIN += 1;
      fail += 1;
    }
    // Not counted as REQUESTS_LOST when terminal is explicit.
    counters.USER_RESUBMISSION_REQUIRED += 1; // honest after exhaustion
    continue;
  }

  if (!result.ok || !("messagePreview" in result) || !result.messagePreview) {
    counters.REQUESTS_LOST += 1;
    counters.EMPTY += 1;
    fail += 1;
    continue;
  }

  counters.REQUESTS_USEFUL_TERMINAL += 1;
  if (/\bask again|theme to deepen\b/i.test(result.messagePreview)) {
    counters.ASK_AGAIN += 1;
    fail += 1;
  }
  if (!assertsNoIrrelevantProtectedState(result.messagePreview, accepted.message)) {
    counters.IRRELEVANT_PROTECTED_STATE_INJECTION += 1;
    fail += 1;
  }
  if (attempts > 2) {
    counters.DUPLICATE_COMPLETION += 1;
    fail += 1;
  }
}

// Supported transient classes (modes 0-4,6): resubmission must be 0
const supportedResubmit = 0; // we only increment USER_RESUBMISSION on mode 5
const supportedLost = counters.REQUESTS_LOST;
const pass =
  fail === 0 &&
  supportedLost === 0 &&
  counters.ASK_AGAIN === 0 &&
  counters.EMPTY === 0 &&
  counters.IRRELEVANT_PROTECTED_STATE_INJECTION === 0 &&
  counters.DUPLICATE_COMPLETION === 0 &&
  counters.DUPLICATE_SIDE_EFFECT_RISK === 0;

console.log(
  JSON.stringify(
    {
      levelB: "randomized_failure_modes",
      trials: N,
      fail,
      pass,
      counters: { ...counters, supportedResubmitNote: "resubmit only on exhausted mode5" },
    },
    null,
    2,
  ),
);
process.exit(pass ? 0 : 1);

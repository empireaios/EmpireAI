/** Explicit failure metadata always wins over claimed completion and prose. */
export function hasReasoningFailure(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  const gate = r.constitutionalGate as {allowed?: boolean} | undefined;
  const contract = r.responseContract as {code?: string} | undefined;
  return ['FAILED', 'FAILED_FATAL', 'RESULT_UNAVAILABLE', 'INCOMPLETE'].includes(String(r.status)) ||
    ['error', 'terminal_infrastructure', 'degraded_useful'].includes(String(r.kind)) ||
    r.brainCompleted === false || r.semanticSuccess === false || r.transportContractPassed === false ||
    r.degradedUsed === true || !!r.reasoningFailure || r.recoveryExhausted === true ||
    gate?.allowed === false || /blocked/i.test(contract?.code ?? '');
}

/** Completion comes from authenticated server metadata, never model prose. */
export function isConfirmedReasoning(value: unknown): boolean {
  if (!value || typeof value !== 'object' || hasReasoningFailure(value)) return false;
  const r = value as Record<string, unknown>;
  return r.kind === 'llm' && r.brainCompleted === true && r.semanticSuccess === true &&
    r.transportContractPassed === true && r.requestRemainsRunning !== true &&
    (r.status === undefined || r.status === 'COMPLETED') &&
    typeof r.message === 'string' && !!r.message.trim();
}

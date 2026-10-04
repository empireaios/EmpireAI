/** Completion comes from authenticated server metadata, never model prose. */
export function isConfirmedReasoning(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false;
  const r = value as Record<string, unknown>;
  const gate = r.constitutionalGate as {allowed?: boolean} | undefined;
  const contract = r.responseContract as {code?: string} | undefined;
  return r.kind === 'llm' && r.brainCompleted === true && r.semanticSuccess === true &&
    r.transportContractPassed === true && r.degradedUsed !== true && !r.reasoningFailure &&
    r.requestRemainsRunning !== true && r.recoveryExhausted !== true && gate?.allowed !== false &&
    !/blocked/i.test(contract?.code ?? '') && typeof r.message === 'string' && !!r.message.trim();
}

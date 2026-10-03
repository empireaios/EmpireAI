import { writeSync } from 'node:fs';

export type CommissioningAccessDecision = { requestId: string; granted: boolean };

/** Tier-0 intentionally disables Fastify logging. Use its supervised stdout
 * directly, with a fixed, bounded schema; never accept headers or URLs here.
 * This is an operational audit event, not a provider/accounting ledger entry.
 */
export function auditCommissioningAccess(decision: CommissioningAccessDecision): void {
  const requestId = /^[A-Za-z0-9_-]{1,128}$/.test(decision.requestId)
    ? decision.requestId : 'invalid-request-id';
  const line = Buffer.from(JSON.stringify({
    event: 'commissioning_operator_read_authorization',
    observedAt: new Date().toISOString(),
    requestId,
    granted: decision.granted === true,
    scope: 'assurance_accounting_read_only',
  }) + '\n');
  if (writeSync(1, line) !== line.length) throw Error('Commissioning audit unavailable');
}

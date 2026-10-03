/** The thirteen independent domains, distinct from legacy Birth gates. */
export const assuranceDomains = [
  'runtime', 'workers', 'scheduler', 'pillow-omissions', 'marketplace-orders',
  'supplier-fulfilment-tracking', 'listing-drift', 'money-transactions',
  'refunds-reimbursements', 'provider-accounting', 'evidence-freshness',
  'authority-spending', 'persistence-backups-recovery',
] as const;

export function summarizeAssuranceCoverage(coverage: unknown, current: boolean) {
  const unknown = { current: false as const, passed: null, failed: null, unverified: null, required: 13 };
  if (!current || !Array.isArray(coverage) || coverage.length !== assuranceDomains.length) return unknown;
  const seen = new Set<string>();
  let passed = 0, failed = 0, unverified = 0;
  for (const item of coverage) {
    if (!item || typeof item !== 'object' || !assuranceDomains.includes(item.source) || seen.has(item.source)) return unknown;
    seen.add(item.source);
    if (item.status === 'PASS') passed++;
    else if (item.status === 'FAIL') failed++;
    else if (['STALE', 'NOT_CHECKED', 'SOURCE_UNAVAILABLE'].includes(item.status)) unverified++;
    else return unknown;
  }
  return { current: true as const, passed, failed, unverified, required: assuranceDomains.length };
}

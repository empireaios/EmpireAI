/** Presentation only. Never use these labels for eligibility or accounting. */
const absentLabels = new Set([
  'Unknown', 'Not measured', 'Not calculated', 'Not established', 'Not confirmed',
  'Not certified', 'No certified profit', 'NOT SET', 'Pending target',
  'Not measured; certified actuals required', 'Not observed', 'Not set',
]);
export function ownerMetric(value: string): string {
  return absentLabels.has(value) ? '—' : value;
}

/** Home shows the current decision queue; originals remain in decision history.
 * Never suppress an actionable record by historical ID or title. */
export function homeRecommendationVisible(record: Record<string, unknown>): boolean {
  return record.classification !== 'SYNTHETIC' &&
    record.status === 'AWAITING_OWNER_REVIEW' && !record.ownerDecision;
}

export function ownerNavigationParent(path: string): string {
  // The existing product evidence drill-down is shared with Approvals and System.
  // Keep its canonical product context without changing any destination or authority.
  if (path === '/cockpit/commerce/governed') return '/cockpit/products';
  if (path === '/cockpit/governance' || path.startsWith('/cockpit/governance/') || path === '/cockpit/workforce/audit') return '/cockpit/assurance';
  if (path === '/cockpit/operations/authorizations' || path === '/cockpit/development/approvals') return '/cockpit/approvals';
  if (path === '/cockpit/operations/orders' || path === '/cockpit/operations/fulfillment' || path === '/cockpit/operations/support' || path === '/cockpit/commerce/transactions') return '/cockpit/orders';
  if (path === '/cockpit/infrastructure' || path.startsWith('/cockpit/infrastructure/') || path === '/cockpit/workforce' || path.startsWith('/cockpit/workforce/')) return '/cockpit/system';
  if (path === '/cockpit/intelligence') return '/cockpit/eyes';
  if (path === '/cockpit/founder/executive-calendar') return '/cockpit/calendar';
  if (path === '/cockpit/founder/executive-approval') return '/cockpit/approvals';
  if (path === '/cockpit/founder/executive-finance' || path === '/cockpit/founder/executive-budget' || path === '/cockpit/founder/cash-reserve' || path === '/cockpit/founder/financial-scenario') return '/cockpit/finance';
  if (path === '/cockpit/development/pillow' || path.startsWith('/cockpit/founder/')) return '/cockpit/ceo';
  if (path.startsWith('/cockpit/intelligence/')) return '/cockpit/eyes';
  if (path === '/cockpit/advisor' || path.startsWith('/cockpit/development/')) return '/cockpit/system';
  return path;
}

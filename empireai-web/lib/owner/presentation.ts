/** Presentation only. Never use these labels for eligibility or accounting. */
const absentLabels = new Set([
  'Unknown', 'Not measured', 'Not calculated', 'Not established', 'Not confirmed',
  'Not certified', 'No certified profit', 'NOT SET', 'Pending target',
  'Not measured; certified actuals required', 'Not observed', 'Not set',
]);
export function ownerMetric(value: string): string {
  return absentLabels.has(value) ? '—' : value;
}

/** A bounded presentation label. Full source advice stays in the decision view. */
export function recommendationHeadline(value: string): string {
  const source = value.replace(/\*\*|__|`/g, '').replace(/\s+/g, ' ').trim();
  // Translate the two retained research outcomes without implying product approval.
  // Do not discard their decision identities, pending status or original rationale.
  if (/^Grand King, my recommendation for EMPIREAI-CANDIDATE-\d+(?:-FOLLOWUP)? is EVIDENCE[-_ ]INSUFFICIENT\./i.test(source)) return 'Product evidence is insufficient. Review the findings and remaining gaps.';
  if (/^Grand King, my recommendation is to advance Candidate #\d+ through evidence collection/i.test(source)) return 'Review further product research. No defensible winner has been established.';
  const text = source;
  if (text.length <= 160) return text;
  const excerpt = text.slice(0, 159);
  const boundary = excerpt.lastIndexOf(' ');
  return excerpt.slice(0, boundary > 80 ? boundary : 159).trimEnd() + '…';
}

/** Home shows the current decision queue; originals remain in decision history.
 * Never suppress an actionable record by historical ID or title. */
export function homeRecommendationVisible(record: Record<string, unknown>): boolean {
  return record.classification !== 'SYNTHETIC' &&
    record.status === 'AWAITING_OWNER_REVIEW' && !record.ownerDecision;
}

export function ownerNavigationParent(path: string): string {
  if (path === '/cockpit/approvals') return '/cockpit/products';
  // Existing legacy routes retain controls; only their owner navigation context changes.
  if (['/cockpit/commerce/ad-intelligence','/cockpit/commerce/intelligence'].includes(path)) return '/cockpit/eyes';
  if (['/cockpit/commerce/ads','/cockpit/commerce/launch','/cockpit/commerce/marketing','/cockpit/commerce/marketplace','/cockpit/commerce/store'].includes(path)) return '/cockpit/listings';
  if (path === '/cockpit/commerce/factory' || path === '/cockpit/commerce/workspace' || path.startsWith('/cockpit/commerce/workspace/')) return '/cockpit/products';
  if (path === '/cockpit/commerce' || path === '/cockpit/commerce/operating') return '/cockpit/ceo';
  if (path === '/cockpit/commerce/automation' || path === '/cockpit/operations/automation') return '/cockpit/system';

  // Retained Executive Command screens share the CEO's execution context.
  if (['/cockpit/command', '/cockpit/missions', '/cockpit/relationship', '/cockpit/development'].includes(path)) return '/cockpit/ceo';
  // The department root already redirects to its order queue.
  if (path === '/cockpit/operations') return '/cockpit/orders';
  // The existing product evidence drill-down is shared with Approvals and System.
  // Keep its canonical product context without changing any destination or authority.
  if (path === '/cockpit/commerce/governed') return '/cockpit/products';
  if (path === '/cockpit/governance' || path.startsWith('/cockpit/governance/') || path === '/cockpit/workforce/audit') return '/cockpit/assurance';
  if (path === '/cockpit/operations/authorizations' || path === '/cockpit/development/approvals') return '/cockpit/products';
  if (path === '/cockpit/operations/orders' || path === '/cockpit/operations/fulfillment' || path === '/cockpit/operations/support' || path === '/cockpit/commerce/transactions') return '/cockpit/orders';
  if (path === '/cockpit/infrastructure' || path.startsWith('/cockpit/infrastructure/') || path === '/cockpit/workforce' || path.startsWith('/cockpit/workforce/')) return '/cockpit/system';
  if (path === '/cockpit/intelligence') return '/cockpit/eyes';
  if (path === '/cockpit/founder/executive-calendar') return '/cockpit/calendar';
  if (path === '/cockpit/founder/executive-approval') return '/cockpit/products';
  if (path === '/cockpit/founder/executive-finance' || path === '/cockpit/founder/executive-budget' || path === '/cockpit/founder/cash-reserve' || path === '/cockpit/founder/financial-scenario') return '/cockpit/finance';
  if (path === '/cockpit/development/pillow' || path.startsWith('/cockpit/founder/')) return '/cockpit/ceo';
  if (path.startsWith('/cockpit/intelligence/')) return '/cockpit/eyes';
  if (path === '/cockpit/advisor' || path.startsWith('/cockpit/development/')) return '/cockpit/system';
  return path;
}

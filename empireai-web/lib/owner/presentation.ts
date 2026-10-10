/** Presentation only. Never use these labels for eligibility or accounting. */
const absentLabels = new Set([
  'Unknown', 'Not measured', 'Not calculated', 'Not established', 'Not confirmed',
  'Not certified', 'No certified profit', 'NOT SET', 'Pending target',
  'Not measured; certified actuals required', 'Not observed',
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
  if (path === '/cockpit/development/pillow' || path.startsWith('/cockpit/founder/')) return '/cockpit/ceo';
  if (path.startsWith('/cockpit/intelligence/')) return '/cockpit/eyes';
  if (path === '/cockpit/advisor' || path.startsWith('/cockpit/development/')) return '/cockpit/system';
  return path;
}

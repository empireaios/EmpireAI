import {inspectAssurance} from './independent-assurance.mjs';

/** Mandatory current health is independent of retained workflow acceptance.
 * Unknown coverage and external limitations are blockers, never implied passes.
 */
export function closureHealthBlockers(snapshot, filename, now = Date.now()) {
  const blockers = [];
  if (snapshot.monitor?.fresh !== true) blockers.push('CURRENT_MONITOR_UNVERIFIED');
  if (snapshot.paused?.paused !== false) blockers.push('ASSURANCE_PAUSED_OR_UNKNOWN');
  if (snapshot.lease?.status === 'ACTIVE') blockers.push('DEPLOYMENT_IN_PROGRESS');
  if (snapshot.incidents.some(i => ['HIGH','CRITICAL'].includes(i.severity) && !['CLOSED','RECOVERED'].includes(i.status)))
    blockers.push('UNRESOLVED_HIGH_SEVERITY_INCIDENTS');
  const verdict = inspectAssurance(filename, {now, epoch:0, intervalMs:300000, graceMs:120000});
  if (verdict.healthy !== true) blockers.push('INDEPENDENT_COVERAGE_NOT_VERIFIED');
  return blockers;
}

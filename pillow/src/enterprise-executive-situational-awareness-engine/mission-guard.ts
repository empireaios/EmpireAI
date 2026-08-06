/** Reject boundary-violating situational awareness inputs. */

export function collectBoundaryViolations(input: {
  fabricateMetrics?: boolean;
  silentSuppressCritical?: boolean;
  autoModifyProduction?: boolean;
  bypassGovernance?: boolean;
  overridePillow?: boolean;
  overrideGrandKing?: boolean;
}): string[] {
  const errors: string[] = [];
  if (input.fabricateMetrics === true) errors.push("fabricateMetrics forbidden — evidence-based only");
  if (input.silentSuppressCritical === true) errors.push("silentSuppressCritical forbidden — critical deterioration must not be silenced");
  if (input.autoModifyProduction === true) errors.push("autoModifyProduction forbidden");
  if (input.bypassGovernance === true) errors.push("bypassGovernance forbidden");
  if (input.overridePillow === true) errors.push("overridePillow forbidden");
  if (input.overrideGrandKing === true) errors.push("overrideGrandKing forbidden");
  return errors;
}

export function hasBoundaryViolation(input: Parameters<typeof collectBoundaryViolations>[0]): boolean {
  return collectBoundaryViolations(input).length > 0;
}
